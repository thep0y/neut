import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { SidebarMenuBadge } from "~/components/sidebar/SidebarMenuBadge/SidebarMenuBadge";

function badge(): HTMLElement {
  return document.querySelector(
    '[data-slot="sidebar-menu-badge"]',
  ) as HTMLElement;
}

describe("SidebarMenuBadge", () => {
  it("渲染 data-slot / data-sidebar 标识", () => {
    render(() => <SidebarMenuBadge />);

    expect(badge()).toHaveAttribute("data-sidebar", "menu-badge");
  });

  it("class 参与合并", () => {
    render(() => <SidebarMenuBadge class="right-2" />);

    expect(badge()).toHaveClass(
      "pointer-events-none",
      "absolute",
      "tabular-nums",
      "right-2",
    );
  });

  it("classList 以布尔条件增删 class", () => {
    render(() => (
      <SidebarMenuBadge classList={{ "keep-me": true, "drop-me": false }} />
    ));

    expect(badge()).toHaveClass("keep-me");
    expect(badge()).not.toHaveClass("drop-me");
  });

  it("透传未消费的原生属性与子节点", () => {
    render(() => (
      <SidebarMenuBadge id="badge-id" aria-label="未读">
        3
      </SidebarMenuBadge>
    ));

    expect(badge()).toHaveAttribute("id", "badge-id");
    expect(badge()).toHaveAttribute("aria-label", "未读");
    expect(badge()).toHaveTextContent("3");
  });
});
