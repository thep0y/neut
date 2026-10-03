import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Message } from "~/components/message/Message/Message";
import type { MessageAlign } from "~/components/message/Message/Message.types";

function messageOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="message"]') as HTMLElement;
}

/** Message：单条消息的行布局，align 决定头像/内容的排布方向。 */
describe("Message - 默认值与 align", () => {
  it("渲染 div，默认 align=start", () => {
    const { container } = render(() => <Message />);
    const element = messageOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-align")).toBe("start");
    expect(element.classList.contains("group/message")).toBe(true);
  });

  it("align=end 写到 data-align 并反转整行", () => {
    const { container } = render(() => <Message align="end" />);
    const element = messageOf(container);

    expect(element.getAttribute("data-align")).toBe("end");
    expect(
      element.classList.contains("data-[align=end]:flex-row-reverse"),
    ).toBe(true);
  });

  it("align 由外部回写时 data-align 跟随变化（start ↔ end）", () => {
    const [align, setAlign] = createSignal<MessageAlign>("start");
    const { container } = render(() => <Message align={align()} />);

    expect(messageOf(container).getAttribute("data-align")).toBe("start");

    setAlign("end");
    expect(messageOf(container).getAttribute("data-align")).toBe("end");

    setAlign("start");
    expect(messageOf(container).getAttribute("data-align")).toBe("start");
  });
});

describe("Message - 类名与属性透传", () => {
  it("合并 class 与 classList", () => {
    const { container } = render(() => (
      <Message class="my-message" classList={{ "is-compact": true }} />
    ));
    const element = messageOf(container);

    expect(element.classList.contains("my-message")).toBe(true);
    expect(element.classList.contains("is-compact")).toBe(true);
  });

  it("透传其余属性、事件与 children", () => {
    const onClick = vi.fn();
    const { container } = render(() => (
      <Message id="m1" aria-label="消息" onClick={onClick}>
        <span data-testid="child">你好</span>
      </Message>
    ));
    const element = messageOf(container);

    expect(element.id).toBe("m1");
    expect(element.getAttribute("aria-label")).toBe("消息");
    expect(container.querySelector('[data-testid="child"]')?.textContent).toBe(
      "你好",
    );

    element.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
