import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { SidebarMenuSub } from "~/components/sidebar/SidebarMenuSub/SidebarMenuSub";

function sub(): HTMLElement {
  return document.querySelector(
    '[data-slot="sidebar-menu-sub"]',
  ) as HTMLElement;
}

describe("SidebarMenuSub", () => {
  it("渲染为 ul 并带 data-sidebar", () => {
    render(() => <SidebarMenuSub />);

    expect(sub().tagName).toBe("UL");
    expect(sub()).toHaveAttribute("data-sidebar", "menu-sub");
  });

  it("class 参与合并并覆盖冲突的横向内边距", () => {
    render(() => <SidebarMenuSub class="px-4" />);

    expect(sub()).toHaveClass(
      "flex",
      "min-w-0",
      "flex-col",
      "border-l",
      "px-4",
    );
    expect(sub()).not.toHaveClass("px-2.5");
  });

  it("classList 以布尔条件增删 class", () => {
    render(() => (
      <SidebarMenuSub classList={{ "keep-me": true, "drop-me": false }} />
    ));

    expect(sub()).toHaveClass("keep-me");
    expect(sub()).not.toHaveClass("drop-me");
  });

  it("透传未消费的原生属性与子节点", () => {
    render(() => (
      <SidebarMenuSub id="sub-id">
        <li>子项</li>
      </SidebarMenuSub>
    ));

    expect(sub()).toHaveAttribute("id", "sub-id");
    expect(sub()).toHaveTextContent("子项");
  });
});
