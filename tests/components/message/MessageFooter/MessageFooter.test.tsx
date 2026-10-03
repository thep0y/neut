import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { MessageFooter } from "~/components/message/MessageFooter/MessageFooter";

function footerOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="message-footer"]') as HTMLElement;
}

/** MessageFooter：消息下方的内容（状态、操作），随消息一侧对齐。 */
describe("MessageFooter", () => {
  it("渲染 div 并带 data-slot 与水平内边距", () => {
    const { container } = render(() => <MessageFooter />);
    const element = footerOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-slot")).toBe("message-footer");
    expect(element.classList.contains("px-3")).toBe(true);
    expect(element.classList.contains("text-xs")).toBe(true);
  });

  it("带 align=end 时贴末端、ghost 气泡时去内边距的父级选择器", () => {
    const { container } = render(() => <MessageFooter />);
    const element = footerOf(container);

    expect(
      element.classList.contains("group-data-[align=end]/message:justify-end"),
    ).toBe(true);
    expect(
      element.classList.contains("group-has-data-[variant=ghost]/message:px-0"),
    ).toBe(true);
  });

  it("合并 class 与 classList", () => {
    const { container } = render(() => (
      <MessageFooter class="my-footer" classList={{ "is-hidden": true }} />
    ));
    const element = footerOf(container);

    expect(element.classList.contains("my-footer")).toBe(true);
    expect(element.classList.contains("is-hidden")).toBe(true);
  });

  it("透传其余属性与 children（如状态文本）", () => {
    const { container } = render(() => (
      <MessageFooter aria-live="polite">已送达</MessageFooter>
    ));
    const element = footerOf(container);

    expect(element.getAttribute("aria-live")).toBe("polite");
    expect(element.textContent).toBe("已送达");
  });
});
