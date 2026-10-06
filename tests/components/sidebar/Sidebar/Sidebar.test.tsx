import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Sidebar } from "~/components/sidebar/Sidebar/Sidebar";
import type { SidebarProps } from "~/components/sidebar/Sidebar/Sidebar.types";
import { SidebarProvider } from "~/components/sidebar/SidebarProvider/SidebarProvider";
import type { SidebarProviderProps } from "~/components/sidebar/SidebarProvider/SidebarProvider.types";

/**
 * Sidebar 的桌面外壳契约：
 * - 外层 `data-slot="sidebar"` 承载 data-state / data-collapsible / data-variant / data-side，
 *   下游样式全靠这几个属性；
 * - `collapsible="none"` 时退化成单层普通容器（没有 gap / container 分层）；
 * - `side` / `variant` 原样透传到状态属性。
 *
 * 已知缺陷（见最终报告）：第 73 行把原始 `props` 而非 `others` 展开到
 * `sidebar-container` 上，因此调用方传入 `class` 时会覆盖掉容器自身的布局类，
 * 并把 `side`/`variant`/`collapsible` 泄漏成 DOM 属性。下面的用例只断言非缺陷行为。
 */
function renderSidebar(
  props: SidebarProps = {},
  providerProps: SidebarProviderProps = {},
) {
  return render(() => (
    <SidebarProvider {...providerProps}>
      <Sidebar {...props}>
        <span data-testid="child">内容</span>
      </Sidebar>
    </SidebarProvider>
  ));
}

function shell(): HTMLElement {
  return document.querySelector('[data-slot="sidebar"]') as HTMLElement;
}

describe("Sidebar - 桌面外壳", () => {
  it("默认渲染为左侧、sidebar 变体、offcanvas 折叠的展开态", () => {
    renderSidebar();

    expect(shell()).toHaveAttribute("data-state", "expanded");
    expect(shell()).toHaveAttribute("data-collapsible", "");
    expect(shell()).toHaveAttribute("data-variant", "sidebar");
    expect(shell()).toHaveAttribute("data-side", "left");
  });

  it("渲染 gap / container / inner 三层结构，内容挂在 inner 内", () => {
    const { container } = renderSidebar();

    expect(container.querySelector('[data-slot="sidebar-gap"]')).not.toBeNull();
    expect(
      container.querySelector('[data-slot="sidebar-container"]'),
    ).not.toBeNull();
    const inner = container.querySelector('[data-slot="sidebar-inner"]');
    expect(inner).toHaveAttribute("data-sidebar", "sidebar");
    expect(
      inner?.contains(container.querySelector('[data-testid="child"]')),
    ).toBe(true);
  });

  it("折叠时 data-state=collapsed，data-collapsible 取折叠模式", () => {
    renderSidebar({ collapsible: "icon" }, { defaultOpen: false });

    expect(shell()).toHaveAttribute("data-state", "collapsed");
    expect(shell()).toHaveAttribute("data-collapsible", "icon");
  });

  it("折叠模式为 offcanvas 时同样写入 data-collapsible", () => {
    renderSidebar({ collapsible: "offcanvas" }, { defaultOpen: false });

    expect(shell()).toHaveAttribute("data-collapsible", "offcanvas");
  });

  it("side=right 透传到外层与 container", () => {
    const { container } = renderSidebar({ side: "right" });

    expect(shell()).toHaveAttribute("data-side", "right");
    expect(
      container.querySelector('[data-slot="sidebar-container"]'),
    ).toHaveAttribute("data-side", "right");
  });

  it("variant=floating 透传", () => {
    renderSidebar({ variant: "floating" });

    expect(shell()).toHaveAttribute("data-variant", "floating");
  });

  it("variant=inset 透传", () => {
    renderSidebar({ variant: "inset" });

    expect(shell()).toHaveAttribute("data-variant", "inset");
  });

  it("container 在未传 class 时保留自身布局类", () => {
    const { container } = renderSidebar();

    expect(
      container.querySelector('[data-slot="sidebar-container"]'),
    ).toHaveClass("fixed", "inset-y-0", "z-10", "hidden", "h-svh");
  });
});

describe("Sidebar - collapsible=none", () => {
  it("退化为单层容器，不带 data-state", () => {
    renderSidebar({ collapsible: "none" });

    expect(shell()).not.toHaveAttribute("data-state");
    expect(shell()).not.toHaveAttribute("data-collapsible");
    expect(
      document.querySelector('[data-slot="sidebar-container"]'),
    ).toBeNull();
  });

  it("传 class 时容器仍保留自身布局类，且不把自有 props 泄漏到 DOM（回归）", () => {
    // 这里走的是有 sidebar-container 的分支；此前该分支写成 {...props}，
    // 于是调用方一旦传 class，布局类会被整体覆盖、side/variant 还会漏到 DOM 上
    renderSidebar({
      side: "right",
      variant: "floating",
      class: "my-class",
      classList: { "keep-me": true },
    });
    const container = document.querySelector(
      '[data-slot="sidebar-container"]',
    ) as HTMLElement;

    expect(container).toHaveClass("fixed", "inset-y-0", "z-10", "my-class");
    expect(container).toHaveClass("keep-me");
    expect(container).toHaveAttribute("data-side", "right");
    expect(container).not.toHaveAttribute("variant");
    expect(container).not.toHaveAttribute("collapsible");
  });

  it("class 与 classList 参与合并，且保留子节点", () => {
    renderSidebar({
      collapsible: "none",
      class: "bg-red-500",
      classList: { "keep-me": true, "drop-me": false },
    });

    expect(shell()).toHaveClass("flex", "h-full", "flex-col", "bg-red-500");
    expect(shell()).toHaveClass("keep-me");
    expect(shell()).not.toHaveClass("drop-me");
    expect(shell()).toHaveTextContent("内容");
  });
});
