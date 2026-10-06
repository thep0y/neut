import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { SidebarFooter } from "~/components/sidebar/SidebarFooter/SidebarFooter";

function footer(): HTMLElement {
  return document.querySelector('[data-slot="sidebar-footer"]') as HTMLElement;
}

describe("SidebarFooter", () => {
  it("渲染 data-slot / data-sidebar 标识", () => {
    render(() => <SidebarFooter />);

    expect(footer()).toHaveAttribute("data-sidebar", "footer");
  });

  it("class 参与合并并覆盖冲突的间距类", () => {
    render(() => <SidebarFooter class="p-8" />);

    expect(footer()).toHaveClass("flex", "flex-col", "gap-2", "p-8");
    expect(footer()).not.toHaveClass("p-2");
  });

  it("classList 以布尔条件增删 class", () => {
    render(() => (
      <SidebarFooter classList={{ "keep-me": true, "drop-me": false }} />
    ));

    expect(footer()).toHaveClass("keep-me");
    expect(footer()).not.toHaveClass("drop-me");
  });

  it("透传未消费的原生属性与子节点", () => {
    render(() => (
      <SidebarFooter id="footer-id" aria-label="页脚">
        <span>页脚内容</span>
      </SidebarFooter>
    ));

    expect(footer()).toHaveAttribute("id", "footer-id");
    expect(footer()).toHaveAttribute("aria-label", "页脚");
    expect(footer()).toHaveTextContent("页脚内容");
  });
});
