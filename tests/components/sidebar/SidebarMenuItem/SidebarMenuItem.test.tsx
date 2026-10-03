import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { SidebarMenuItem } from "~/components/sidebar/SidebarMenuItem/SidebarMenuItem";

function item(): HTMLElement {
  return document.querySelector(
    '[data-slot="sidebar-menu-item"]',
  ) as HTMLElement;
}

describe("SidebarMenuItem", () => {
  it("渲染为 li 并带 data-sidebar", () => {
    render(() => <SidebarMenuItem />);

    expect(item().tagName).toBe("LI");
    expect(item()).toHaveAttribute("data-sidebar", "menu-item");
  });

  it("class 参与合并", () => {
    render(() => <SidebarMenuItem class="mt-1" />);

    expect(item()).toHaveClass("group/menu-item", "relative", "mt-1");
  });

  it("classList 以布尔条件增删 class", () => {
    render(() => (
      <SidebarMenuItem classList={{ "keep-me": true, "drop-me": false }} />
    ));

    expect(item()).toHaveClass("keep-me");
    expect(item()).not.toHaveClass("drop-me");
  });

  it("透传未消费的原生属性与子节点", () => {
    render(() => (
      <SidebarMenuItem id="item-id">
        <span>条目</span>
      </SidebarMenuItem>
    ));

    expect(item()).toHaveAttribute("id", "item-id");
    expect(item()).toHaveTextContent("条目");
  });
});
