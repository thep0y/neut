import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { SidebarMenuSubItem } from "~/components/sidebar/SidebarMenuSubItem/SidebarMenuSubItem";

function item(): HTMLElement {
  return document.querySelector(
    '[data-slot="sidebar-menu-sub-item"]',
  ) as HTMLElement;
}

describe("SidebarMenuSubItem", () => {
  it("渲染为 li 并带 data-sidebar", () => {
    render(() => <SidebarMenuSubItem />);

    expect(item().tagName).toBe("LI");
    expect(item()).toHaveAttribute("data-sidebar", "menu-sub-item");
  });

  it("class 参与合并", () => {
    render(() => <SidebarMenuSubItem class="mt-1" />);

    expect(item()).toHaveClass("group/menu-sub-item", "relative", "mt-1");
  });

  it("classList 以布尔条件增删 class", () => {
    render(() => (
      <SidebarMenuSubItem classList={{ "keep-me": true, "drop-me": false }} />
    ));

    expect(item()).toHaveClass("keep-me");
    expect(item()).not.toHaveClass("drop-me");
  });

  it("透传未消费的原生属性与子节点", () => {
    render(() => (
      <SidebarMenuSubItem id="sub-item-id">
        <span>子条目</span>
      </SidebarMenuSubItem>
    ));

    expect(item()).toHaveAttribute("id", "sub-item-id");
    expect(item()).toHaveTextContent("子条目");
  });
});
