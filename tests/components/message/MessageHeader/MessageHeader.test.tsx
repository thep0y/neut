import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { MessageHeader } from "~/components/message/MessageHeader/MessageHeader";

function headerOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="message-header"]') as HTMLElement;
}

/** MessageHeader：消息上方的内容（如发送者名），始终对齐到 start。 */
describe("MessageHeader", () => {
  it("渲染 div 并带 data-slot 与水平内边距", () => {
    const { container } = render(() => <MessageHeader />);
    const element = headerOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-slot")).toBe("message-header");
    expect(element.classList.contains("px-3")).toBe(true);
    expect(element.classList.contains("text-muted-foreground")).toBe(true);
  });

  it("ghost 气泡时去掉左右内边距（父级选择器）", () => {
    const { container } = render(() => <MessageHeader />);

    expect(
      headerOf(container).classList.contains(
        "group-has-data-[variant=ghost]/message:px-0",
      ),
    ).toBe(true);
  });

  it("合并 class 与 classList", () => {
    const { container } = render(() => (
      <MessageHeader class="my-header" classList={{ "is-bold": true }} />
    ));
    const element = headerOf(container);

    expect(element.classList.contains("my-header")).toBe(true);
    expect(element.classList.contains("is-bold")).toBe(true);
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <MessageHeader aria-label="发送者">小明</MessageHeader>
    ));
    const element = headerOf(container);

    expect(element.getAttribute("aria-label")).toBe("发送者");
    expect(element.textContent).toBe("小明");
  });
});
