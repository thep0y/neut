import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { MessageContent } from "~/components/message/MessageContent/MessageContent";

function contentOf(container: HTMLElement): HTMLElement {
  return container.querySelector(
    '[data-slot="message-content"]',
  ) as HTMLElement;
}

/** MessageContent：包裹 header、消息主体与 footer，align=end 时子级贴到末端。 */
describe("MessageContent", () => {
  it("渲染 div 并带 data-slot 与纵向堆叠类名", () => {
    const { container } = render(() => <MessageContent />);
    const element = contentOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-slot")).toBe("message-content");
    expect(element.classList.contains("flex-col")).toBe(true);
    expect(element.classList.contains("break-words")).toBe(true);
  });

  it("带「align=end 时子级贴末端」的父级选择器", () => {
    const { container } = render(() => <MessageContent />);

    expect(
      contentOf(container).classList.contains(
        "group-data-[align=end]/message:*:data-slot:self-end",
      ),
    ).toBe(true);
  });

  it("合并 class 与 classList", () => {
    const { container } = render(() => (
      <MessageContent class="my-content" classList={{ "is-wide": true }} />
    ));
    const element = contentOf(container);

    expect(element.classList.contains("my-content")).toBe(true);
    expect(element.classList.contains("is-wide")).toBe(true);
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <MessageContent id="c1">
        <span data-testid="child">正文</span>
      </MessageContent>
    ));
    const element = contentOf(container);

    expect(element.id).toBe("c1");
    expect(container.querySelector('[data-testid="child"]')?.textContent).toBe(
      "正文",
    );
  });
});
