import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { SidebarMenu } from "~/components/sidebar/SidebarMenu/SidebarMenu";

function menu(): HTMLElement {
  return document.querySelector('[data-slot="sidebar-menu"]') as HTMLElement;
}

describe("SidebarMenu", () => {
  it("渲染为 ul 并带 data-sidebar", () => {
    render(() => <SidebarMenu />);

    expect(menu().tagName).toBe("UL");
    expect(menu()).toHaveAttribute("data-sidebar", "menu");
  });

  it("class 参与合并", () => {
    render(() => <SidebarMenu class="gap-1" />);

    expect(menu()).toHaveClass(
      "flex",
      "w-full",
      "min-w-0",
      "flex-col",
      "gap-1",
    );
  });

  it("classList 以布尔条件增删 class", () => {
    render(() => (
      <SidebarMenu classList={{ "keep-me": true, "drop-me": false }} />
    ));

    expect(menu()).toHaveClass("keep-me");
    expect(menu()).not.toHaveClass("drop-me");
  });

  it("透传未消费的原生属性与子节点", () => {
    render(() => (
      <SidebarMenu id="menu-id" aria-label="主菜单">
        <li>菜单项</li>
      </SidebarMenu>
    ));

    expect(menu()).toHaveAttribute("id", "menu-id");
    expect(menu()).toHaveAttribute("aria-label", "主菜单");
    expect(menu()).toHaveTextContent("菜单项");
  });
});
