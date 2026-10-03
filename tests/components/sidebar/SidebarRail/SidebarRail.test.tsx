import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { SidebarRail } from "~/components/sidebar/SidebarRail/SidebarRail";
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

function rail(): HTMLButtonElement {
  return document.querySelector(
    '[data-slot="sidebar-rail"]',
  ) as HTMLButtonElement;
}

describe("SidebarRail", () => {
  it("渲染为不可 Tab 聚焦的切换按钮", () => {
    render(() => (
      <SidebarProvider>
        <SidebarRail />
      </SidebarProvider>
    ));

    expect(rail().tagName).toBe("BUTTON");
    expect(rail()).toHaveAttribute("data-sidebar", "rail");
    expect(rail()).toHaveAttribute("aria-label", "Toggle Sidebar");
    expect(rail()).toHaveAttribute("title", "Toggle Sidebar");
    expect(rail()).toHaveAttribute("tabindex", "-1");
  });

  it("点击切换侧边栏并写 cookie", () => {
    render(() => (
      <SidebarProvider>
        <SidebarRail />
      </SidebarProvider>
    ));

    fireEvent.click(rail());

    expect(document.cookie).toContain("sidebar_state=false");

    clearCookies();
  });

  it("class 与 classList 参与合并", () => {
    render(() => (
      <SidebarProvider>
        <SidebarRail
          class="w-6"
          classList={{ "keep-me": true, "drop-me": false }}
        />
      </SidebarProvider>
    ));

    expect(rail()).toHaveClass("absolute", "inset-y-0", "hidden", "w-6");
    expect(rail()).toHaveClass("keep-me");
    expect(rail()).not.toHaveClass("drop-me");
  });
});
