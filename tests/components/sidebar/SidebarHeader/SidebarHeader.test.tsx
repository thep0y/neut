import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { SidebarHeader } from "~/components/sidebar/SidebarHeader/SidebarHeader";

function header(): HTMLElement {
  return document.querySelector('[data-slot="sidebar-header"]') as HTMLElement;
}

describe("SidebarHeader", () => {
  it("渲染 data-slot / data-sidebar 标识", () => {
    render(() => <SidebarHeader />);

    expect(header()).toHaveAttribute("data-sidebar", "header");
  });

  it("class 参与合并并覆盖冲突的间距类", () => {
    render(() => <SidebarHeader class="p-8" />);

    expect(header()).toHaveClass("flex", "flex-col", "gap-2", "p-8");
    expect(header()).not.toHaveClass("p-2");
  });

  it("classList 以布尔条件增删 class", () => {
    render(() => (
      <SidebarHeader classList={{ "keep-me": true, "drop-me": false }} />
    ));

    expect(header()).toHaveClass("keep-me");
    expect(header()).not.toHaveClass("drop-me");
  });

  it("透传未消费的原生属性与子节点", () => {
    render(() => (
      <SidebarHeader id="header-id" aria-label="页眉">
        <span>页眉内容</span>
      </SidebarHeader>
    ));

    expect(header()).toHaveAttribute("id", "header-id");
    expect(header()).toHaveAttribute("aria-label", "页眉");
    expect(header()).toHaveTextContent("页眉内容");
  });
});
