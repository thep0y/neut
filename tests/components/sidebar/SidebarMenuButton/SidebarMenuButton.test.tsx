import { fireEvent, render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";
import { SidebarMenuButton } from "~/components/sidebar/SidebarMenuButton/SidebarMenuButton";
import { SidebarProvider } from "~/components/sidebar/SidebarProvider/SidebarProvider";
import type { SidebarProviderProps } from "~/components/sidebar/SidebarProvider/SidebarProvider.types";

/**
 * SidebarMenuButton 有两条渲染路径：
 * - 没有 `tooltip`：直接渲染多态元素（默认 button），带上 classList；
 * - 有 `tooltip`：包一层 Tooltip，把按钮渲染成 TooltipTrigger，并让
 *   TooltipContent 在"侧边栏折叠（且非移动端）"时才可见（`hidden` 属性）。
 *
 * 两条路径都必须把 `classList` 传下去：tooltip 路径曾经漏传，导致该路径下
 * classList 被静默丢弃（已修，下方有回归用例）。
 */
function menuButton(): HTMLElement {
  return document.querySelector(
    '[data-slot="sidebar-menu-button"]',
  ) as HTMLElement;
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 30));

function renderButton(
  content: () => JSX.Element,
  providerProps: SidebarProviderProps = {},
) {
  return render(() => (
    <SidebarProvider {...providerProps}>{content()}</SidebarProvider>
  ));
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("SidebarMenuButton - 无 tooltip", () => {
  it("默认渲染为 button，size=md 且 data-active=false", () => {
    renderButton(() => <SidebarMenuButton>项目</SidebarMenuButton>);

    expect(menuButton().tagName).toBe("BUTTON");
    expect(menuButton()).toHaveAttribute("data-sidebar", "menu-button");
    expect(menuButton()).toHaveAttribute("data-size", "md");
    expect(menuButton()).toHaveAttribute("data-active", "false");
    expect(menuButton()).toHaveClass("h-8", "text-sm");
  });

  it("isActive 为 true 时输出 data-active=true", () => {
    renderButton(() => <SidebarMenuButton isActive>项目</SidebarMenuButton>);

    expect(menuButton()).toHaveAttribute("data-active", "true");
  });

  it("variant=outline 应用描边变体样式", () => {
    renderButton(() => (
      <SidebarMenuButton variant="outline">项目</SidebarMenuButton>
    ));

    expect(menuButton()).toHaveClass(
      "shadow-[0_0_0_1px_var(--sidebar-border)]",
    );
  });

  it("size=sm 与 size=lg 分别切换高度与字号", () => {
    renderButton(() => <SidebarMenuButton size="sm">小</SidebarMenuButton>);
    expect(menuButton()).toHaveAttribute("data-size", "sm");
    expect(menuButton()).toHaveClass("h-7", "text-xs");

    document.body.innerHTML = "";

    renderButton(() => <SidebarMenuButton size="lg">大</SidebarMenuButton>);
    expect(menuButton()).toHaveAttribute("data-size", "lg");
    expect(menuButton()).toHaveClass("h-12", "text-sm");
  });

  it("component 可切换为自定义标签", () => {
    renderButton(() => (
      <SidebarMenuButton component="a" href="/home">
        项目
      </SidebarMenuButton>
    ));

    expect(menuButton().tagName).toBe("A");
    expect(menuButton()).toHaveAttribute("href", "/home");
  });

  it("class 与 classList 参与合并", () => {
    renderButton(() => (
      <SidebarMenuButton
        class="px-4"
        classList={{ "keep-me": true, "drop-me": false }}
      >
        项目
      </SidebarMenuButton>
    ));

    expect(menuButton()).toHaveClass("flex", "w-full", "items-center", "px-4");
    expect(menuButton()).toHaveClass("keep-me");
    expect(menuButton()).not.toHaveClass("drop-me");
  });
});

describe("SidebarMenuButton - tooltip 路径", () => {
  it("tooltip 路径下 classList 同样生效（回归）", () => {
    renderButton(() => (
      <SidebarMenuButton tooltip="提示文字" classList={{ "my-flag": true }}>
        项目
      </SidebarMenuButton>
    ));

    expect(menuButton()).toHaveClass("my-flag");
  });

  it("tooltip 为字符串时渲染为提示文本，展开态下浮层被隐藏", async () => {
    renderButton(() => (
      <SidebarMenuButton tooltip="提示文字">项目</SidebarMenuButton>
    ));

    expect(menuButton()).toHaveAttribute("data-state", "closed");

    fireEvent.focus(menuButton());
    await tick();

    const content = document.querySelector('[role="tooltip"]') as HTMLElement;
    expect(content).toHaveTextContent("提示文字");
    // 展开时（未折叠）tooltip 不应显示
    expect(content).toHaveAttribute("hidden");
  });

  it("tooltip 为对象时可用 children 定制内容，折叠态下浮层不再隐藏", async () => {
    renderButton(
      () => (
        <SidebarMenuButton tooltip={{ children: "对象提示", side: "right" }}>
          项目
        </SidebarMenuButton>
      ),
      { defaultOpen: false },
    );

    fireEvent.focus(menuButton());
    await tick();

    const content = document.querySelector('[role="tooltip"]') as HTMLElement;
    expect(content).toHaveTextContent("对象提示");
    expect(content).not.toHaveAttribute("hidden");
  });

  it("tooltip 路径仍透传 data-* 与自定义属性", () => {
    renderButton(() => (
      <SidebarMenuButton tooltip="提示" data-track="nav" id="nav-item">
        项目
      </SidebarMenuButton>
    ));

    expect(menuButton()).toHaveAttribute("data-track", "nav");
    expect(menuButton()).toHaveAttribute("id", "nav-item");
  });
});
