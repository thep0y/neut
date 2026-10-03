import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { SidebarContent } from "~/components/sidebar/SidebarContent/SidebarContent";

function content(): HTMLElement {
  return document.querySelector('[data-slot="sidebar-content"]') as HTMLElement;
}

describe("SidebarContent", () => {
  it("渲染 data-slot / data-sidebar 标识", () => {
    render(() => <SidebarContent />);

    expect(content()).toHaveAttribute("data-sidebar", "content");
  });

  it("class 参与合并", () => {
    render(() => <SidebarContent class="gap-4" />);

    expect(content()).toHaveClass(
      "flex",
      "min-h-0",
      "flex-1",
      "flex-col",
      "gap-4",
    );
  });

  it("classList 以布尔条件增删 class", () => {
    render(() => (
      <SidebarContent classList={{ "keep-me": true, "drop-me": false }} />
    ));

    expect(content()).toHaveClass("keep-me");
    expect(content()).not.toHaveClass("drop-me");
  });

  it("透传未消费的原生属性与子节点", () => {
    render(() => (
      <SidebarContent id="content-id">
        <span>内容</span>
      </SidebarContent>
    ));

    expect(content()).toHaveAttribute("id", "content-id");
    expect(content()).toHaveTextContent("内容");
  });
});
