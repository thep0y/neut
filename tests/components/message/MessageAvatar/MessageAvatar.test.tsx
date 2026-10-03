import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { MessageAvatar } from "~/components/message/MessageAvatar/MessageAvatar";

function avatarOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="message-avatar"]') as HTMLElement;
}

/** MessageAvatar：头像槽；贴底（self-end），消息带 footer 时由父级选择器上移。 */
describe("MessageAvatar", () => {
  it("渲染 div 并带 data-slot 与贴底类名", () => {
    const { container } = render(() => <MessageAvatar />);
    const element = avatarOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-slot")).toBe("message-avatar");
    expect(element.classList.contains("self-end")).toBe(true);
    expect(element.classList.contains("rounded-full")).toBe(true);
  });

  it("带「消息含 footer 时上移」的父级选择器", () => {
    const { container } = render(() => <MessageAvatar />);

    expect(
      avatarOf(container).classList.contains(
        "group-has-data-[slot=message-footer]/message:-translate-y-8",
      ),
    ).toBe(true);
  });

  it("合并 class 与 classList", () => {
    const { container } = render(() => (
      <MessageAvatar class="my-avatar" classList={{ "is-large": true }} />
    ));
    const element = avatarOf(container);

    expect(element.classList.contains("my-avatar")).toBe(true);
    expect(element.classList.contains("is-large")).toBe(true);
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <MessageAvatar aria-hidden="true">
        <span data-testid="fallback">R</span>
      </MessageAvatar>
    ));
    const element = avatarOf(container);

    expect(element.getAttribute("aria-hidden")).toBe("true");
    expect(
      container.querySelector('[data-testid="fallback"]')?.textContent,
    ).toBe("R");
  });
});
