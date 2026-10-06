import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { SidebarTrigger } from "~/components/sidebar/SidebarTrigger/SidebarTrigger";
import { SidebarProvider } from "~/components/sidebar/SidebarProvider/SidebarProvider";

function clearCookies() {
  for (const part of document.cookie.split(";")) {
    const name = part.split("=")[0]?.trim();
    if (name) {
      // biome-ignore lint/suspicious/noDocumentCookie: 测试需要真实读写 cookie（jsdom 支持）
      document.cookie = `${name}=; path=/; max-age=0`;
    }
  }
}

function trigger(): HTMLButtonElement {
  return document.querySelector(
    '[data-slot="sidebar-trigger"]',
  ) as HTMLButtonElement;
}

describe("SidebarTrigger", () => {
  it("渲染为带侧边栏语义的按钮，sr-only 文本来自 aria-label", () => {
    render(() => (
      <SidebarProvider>
        <SidebarTrigger aria-label="切换侧边栏" />
      </SidebarProvider>
    ));

    expect(trigger().tagName).toBe("BUTTON");
    expect(trigger()).toHaveAttribute("data-sidebar", "trigger");
    expect(trigger()).toHaveAccessibleName("切换侧边栏");
  });

  it("展开时显示 PanelLeft 图标", () => {
    render(() => (
      <SidebarProvider>
        <SidebarTrigger aria-label="切换" />
      </SidebarProvider>
    ));

    expect(trigger().querySelector("svg")).toHaveClass("lucide-panel-left");
  });

  it("折叠时显示 PanelRight 图标", () => {
    render(() => (
      <SidebarProvider defaultOpen={false}>
        <SidebarTrigger aria-label="切换" />
      </SidebarProvider>
    ));

    expect(trigger().querySelector("svg")).toHaveClass("lucide-panel-right");
  });

  it("点击先调用用户 onClick，再切换侧边栏", () => {
    const onClick = vi.fn();
    render(() => (
      <SidebarProvider>
        <SidebarTrigger aria-label="切换" onClick={onClick} />
      </SidebarProvider>
    ));

    expect(document.cookie).not.toContain("sidebar_state=false");

    fireEvent.click(trigger());

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(document.cookie).toContain("sidebar_state=false");

    clearCookies();
  });

  it("class 与 classList 参与合并", () => {
    render(() => (
      <SidebarProvider>
        <SidebarTrigger
          aria-label="切换"
          class="text-red-500"
          classList={{ "keep-me": true, "drop-me": false }}
        />
      </SidebarProvider>
    ));

    expect(trigger()).toHaveClass("text-red-500");
    expect(trigger()).toHaveClass("keep-me");
    expect(trigger()).not.toHaveClass("drop-me");
  });
});
