import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { MessageGroup } from "~/components/message/MessageGroup/MessageGroup";

function groupOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="message-group"]') as HTMLElement;
}

/** MessageGroup：堆叠同一发送者的连续消息。 */
describe("MessageGroup", () => {
  it("渲染 div 并带 data-slot 与纵向堆叠类名", () => {
    const { container } = render(() => <MessageGroup />);
    const element = groupOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-slot")).toBe("message-group");
    expect(element.classList.contains("flex-col")).toBe(true);
    expect(element.classList.contains("gap-2")).toBe(true);
  });

  it("合并 class 与 classList", () => {
    const { container } = render(() => (
      <MessageGroup class="my-thread" classList={{ "is-dense": true }} />
    ));
    const element = groupOf(container);

    expect(element.classList.contains("my-thread")).toBe(true);
    expect(element.classList.contains("is-dense")).toBe(true);
  });

  it("透传其余属性、角色与 children", () => {
    const { container, getAllByTestId } = render(() => (
      <MessageGroup role="log" aria-live="polite" aria-label="对话">
        <span data-testid="message" />
        <span data-testid="message" />
      </MessageGroup>
    ));
    const element = groupOf(container);

    expect(element.getAttribute("role")).toBe("log");
    expect(element.getAttribute("aria-live")).toBe("polite");
    expect(element.getAttribute("aria-label")).toBe("对话");
    expect(getAllByTestId("message")).toHaveLength(2);
  });
});
