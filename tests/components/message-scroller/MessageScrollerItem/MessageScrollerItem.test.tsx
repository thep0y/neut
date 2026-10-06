import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { MessageScrollerItem } from "~/components/message-scroller/MessageScrollerItem/MessageScrollerItem";
import {
  contextWrapper,
  fakeContext,
} from "~tests/components/message-scroller/test-utils";

/**
 * 一行：把 `messageId` / `scrollAnchor` 映射成引擎读取的 data 属性，
 * 并把自身注册进引擎的行注册表。
 */
function renderItem(
  props: Parameters<typeof MessageScrollerItem>[0] = {},
  overrides: Parameters<typeof fakeContext>[0] = {},
) {
  return render(() => <MessageScrollerItem {...props} />, {
    wrapper: contextWrapper(fakeContext(overrides)),
  });
}

function itemOf(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-slot="message-scroller-item"]');
}

describe("MessageScrollerItem - 结构", () => {
  it("渲染带 data-slot 的一行", () => {
    const { container } = renderItem({ messageId: "m1" });

    expect(itemOf(container)?.tagName).toBe("DIV");
  });

  it("合并布局类名与外部 class，并应用 classList", () => {
    const { container } = renderItem({
      messageId: "m1",
      class: "my-row",
      classList: { "row-active": true },
    });

    expect(itemOf(container)?.className).toContain("[content-visibility:auto]");
    expect(itemOf(container)?.className).toContain("my-row");
    expect(itemOf(container)?.className).toContain("row-active");
  });

  it("渲染 children", () => {
    const { container } = renderItem({
      messageId: "m1",
      children: <span data-testid="bubble">x</span>,
    });

    expect(container.querySelector('[data-testid="bubble"]')).not.toBeNull();
  });
});

describe("MessageScrollerItem - data 属性", () => {
  it("messageId 映射成 data-message-id", () => {
    const { container } = renderItem({ messageId: "turn-42" });

    expect(itemOf(container)?.getAttribute("data-message-id")).toBe("turn-42");
  });

  it("没有 messageId 时属性缺失（引擎会跳过这类子节点）", () => {
    const { container } = renderItem();

    expect(itemOf(container)?.hasAttribute("data-message-id")).toBe(false);
  });

  it("scrollAnchor 为 true 时输出 'true'（引擎按此字符串判断锚点）", () => {
    const { container } = renderItem({ messageId: "m1", scrollAnchor: true });

    expect(itemOf(container)?.getAttribute("data-scroll-anchor")).toBe("true");
  });

  it("scrollAnchor 为 false 或省略时输出 'false'", () => {
    const explicit = renderItem({ messageId: "m1", scrollAnchor: false });
    expect(itemOf(explicit.container)?.getAttribute("data-scroll-anchor")).toBe(
      "false",
    );

    const omitted = renderItem({ messageId: "m2" });
    expect(itemOf(omitted.container)?.getAttribute("data-scroll-anchor")).toBe(
      "false",
    );
  });
});

describe("MessageScrollerItem - 与引擎的接线", () => {
  it("挂载时把 id 与元素注册进引擎，卸载时注销", () => {
    const unregister = vi.fn();
    const registerItem = vi.fn(() => unregister);

    const { container, unmount } = renderItem(
      { messageId: "m1" },
      { registerItem },
    );

    expect(registerItem).toHaveBeenCalledWith({
      id: "m1",
      element: itemOf(container),
    });

    unmount();
    expect(unregister).toHaveBeenCalledTimes(1);
  });

  it("没有 messageId 时仍然注册（id 为 undefined，引擎自行忽略）", () => {
    const registerItem = vi.fn(() => () => {});

    renderItem({}, { registerItem });

    expect(registerItem).toHaveBeenCalledWith({
      id: undefined,
      element: expect.any(HTMLElement),
    });
  });
});

describe("MessageScrollerItem - 脱离 Provider", () => {
  it("抛中文错误", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(() => <MessageScrollerItem />)).toThrow(
      /<MessageScrollerItem> 必须渲染在 <MessageScrollerProvider> 内部/,
    );

    error.mockRestore();
  });
});
