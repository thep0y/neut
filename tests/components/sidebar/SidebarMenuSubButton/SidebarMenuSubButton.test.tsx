import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { SidebarMenuSubButton } from "~/components/sidebar/SidebarMenuSubButton/SidebarMenuSubButton";
import { SidebarMenuSubItem } from "~/components/sidebar/SidebarMenuSubItem/SidebarMenuSubItem";

function button(): HTMLElement {
  return document.querySelector(
    '[data-slot="sidebar-menu-sub-button"]',
  ) as HTMLElement;
}

describe("SidebarMenuSubButton", () => {
  it("默认渲染为 a，且默认 size=md、data-active=false", () => {
    render(() => <SidebarMenuSubButton href="/x">子按钮</SidebarMenuSubButton>);

    expect(button().tagName).toBe("A");
    expect(button()).toHaveAttribute("data-sidebar", "menu-sub-button");
    expect(button()).toHaveAttribute("data-size", "md");
    expect(button()).toHaveAttribute("data-active", "false");
    expect(button()).toHaveAttribute("href", "/x");
  });

  it("isActive 为 true 时输出 data-active=true", () => {
    render(() => <SidebarMenuSubButton isActive>当前</SidebarMenuSubButton>);

    expect(button()).toHaveAttribute("data-active", "true");
  });

  it("size=sm 时输出 data-size=sm", () => {
    render(() => <SidebarMenuSubButton size="sm">小号</SidebarMenuSubButton>);

    expect(button()).toHaveAttribute("data-size", "sm");
  });

  it("class 与 classList 参与合并", () => {
    render(() => (
      <SidebarMenuSubButton
        class="px-4"
        classList={{ "keep-me": true, "drop-me": false }}
      />
    ));

    expect(button()).toHaveClass(
      "flex",
      "h-7",
      "min-w-0",
      "items-center",
      "px-4",
    );
    expect(button()).toHaveClass("keep-me");
    expect(button()).not.toHaveClass("drop-me");
  });

  it("可作为 SidebarMenuSubItem 的子节点渲染", () => {
    render(() => (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton href="/a">条目</SidebarMenuSubButton>
      </SidebarMenuSubItem>
    ));

    const item = document.querySelector('[data-slot="sidebar-menu-sub-item"]');
    expect(item?.contains(button())).toBe(true);
  });
});
