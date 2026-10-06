import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { SidebarGroup } from "~/components/sidebar/SidebarGroup/SidebarGroup";

function group(): HTMLElement {
  return document.querySelector('[data-slot="sidebar-group"]') as HTMLElement;
}

describe("SidebarGroup", () => {
  it("渲染 data-slot / data-sidebar 标识", () => {
    render(() => <SidebarGroup />);

    expect(group()).toHaveAttribute("data-sidebar", "group");
  });

  it("class 参与合并并覆盖冲突的间距类", () => {
    render(() => <SidebarGroup class="p-8" />);

    expect(group()).toHaveClass(
      "relative",
      "flex",
      "w-full",
      "min-w-0",
      "flex-col",
      "p-8",
    );
    expect(group()).not.toHaveClass("p-2");
  });

  it("classList 以布尔条件增删 class", () => {
    render(() => (
      <SidebarGroup classList={{ "keep-me": true, "drop-me": false }} />
    ));

    expect(group()).toHaveClass("keep-me");
    expect(group()).not.toHaveClass("drop-me");
  });

  it("透传未消费的原生属性与子节点", () => {
    render(() => (
      <SidebarGroup id="group-id">
        <span>分组</span>
      </SidebarGroup>
    ));

    expect(group()).toHaveAttribute("id", "group-id");
    expect(group()).toHaveTextContent("分组");
  });
});
