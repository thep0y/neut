import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { SidebarInset } from "~/components/sidebar/SidebarInset/SidebarInset";

function inset(): HTMLElement {
  return document.querySelector('[data-slot="sidebar-inset"]') as HTMLElement;
}

describe("SidebarInset", () => {
  it("渲染为 main 并带 data-slot", () => {
    render(() => <SidebarInset />);

    expect(inset()).toBeInstanceOf(HTMLElement);
    expect(inset().tagName).toBe("MAIN");
  });

  it("class 参与合并", () => {
    render(() => <SidebarInset class="bg-muted" />);

    expect(inset()).toHaveClass(
      "relative",
      "flex",
      "w-full",
      "flex-1",
      "flex-col",
      "bg-muted",
    );
  });

  it("classList 以布尔条件增删 class", () => {
    render(() => (
      <SidebarInset classList={{ "keep-me": true, "drop-me": false }} />
    ));

    expect(inset()).toHaveClass("keep-me");
    expect(inset()).not.toHaveClass("drop-me");
  });

  it("透传未消费的原生属性与子节点", () => {
    render(() => (
      <SidebarInset id="inset-id" aria-label="主内容">
        <p>正文</p>
      </SidebarInset>
    ));

    expect(inset()).toHaveAttribute("id", "inset-id");
    expect(inset()).toHaveAttribute("aria-label", "主内容");
    expect(inset()).toHaveTextContent("正文");
  });
});
