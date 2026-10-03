import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { SidebarGroupContent } from "~/components/sidebar/SidebarGroupContent/SidebarGroupContent";

function root(): HTMLElement {
  return document.querySelector(
    '[data-slot="sidebar-group-content"]',
  ) as HTMLElement;
}

describe("SidebarGroupContent", () => {
  it("渲染 data-slot / data-sidebar 标识", () => {
    render(() => <SidebarGroupContent />);

    expect(root()).toHaveAttribute("data-sidebar", "group-content");
  });

  it("class 参与合并", () => {
    render(() => <SidebarGroupContent class="text-xs" />);

    expect(root()).toHaveClass("w-full", "text-xs");
    expect(root()).not.toHaveClass("text-sm");
  });

  it("classList 以布尔条件增删 class", () => {
    render(() => (
      <SidebarGroupContent classList={{ "keep-me": true, "drop-me": false }} />
    ));

    expect(root()).toHaveClass("keep-me");
    expect(root()).not.toHaveClass("drop-me");
  });

  it("透传未消费的原生属性与子节点", () => {
    render(() => (
      <SidebarGroupContent id="gc-id">
        <span>组内容</span>
      </SidebarGroupContent>
    ));

    expect(root()).toHaveAttribute("id", "gc-id");
    expect(root()).toHaveTextContent("组内容");
  });
});
