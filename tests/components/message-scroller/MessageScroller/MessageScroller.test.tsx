import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { MessageScroller } from "~/components/message-scroller/MessageScroller/MessageScroller";
import { createSignal } from "solid-js";
import {
  contextWrapper,
  fakeContext,
} from "~tests/components/message-scroller/test-utils";

/**
 * 有样式的框架：只负责把 context 状态映射成 `data-*`，不渲染子结构。
 * 用例按 `data-slot` 查询，并断言"属性缺失"而不是空串（shadcn 约定）。
 */
function renderFrame(overrides: Parameters<typeof fakeContext>[0] = {}) {
  return render(() => <MessageScroller />, {
    wrapper: contextWrapper(fakeContext(overrides)),
  });
}

describe("MessageScroller - 结构", () => {
  it("渲染一个带 data-slot 的 div", () => {
    const { container } = renderFrame();

    const element = container.querySelector('[data-slot="message-scroller"]');
    expect(element?.tagName).toBe("DIV");
  });

  it("承载布局类名，并与外部 class 合并", () => {
    const { container } = render(() => <MessageScroller class="custom-x" />, {
      wrapper: contextWrapper(fakeContext()),
    });

    const element = container.querySelector('[data-slot="message-scroller"]');
    expect(element?.className).toContain("group/message-scroller");
    expect(element?.className).toContain("custom-x");
  });

  it("classList 会被应用", () => {
    const { container } = render(
      () => <MessageScroller classList={{ "is-active": true }} />,
      { wrapper: contextWrapper(fakeContext()) },
    );

    expect(
      container.querySelector('[data-slot="message-scroller"]')?.className,
    ).toContain("is-active");
  });

  it("透传其余属性（如 id / data-*）", () => {
    const { container } = render(
      () => <MessageScroller id="frame" data-custom="yes" />,
      { wrapper: contextWrapper(fakeContext()) },
    );

    const element = container.querySelector('[data-slot="message-scroller"]');
    expect(element?.id).toBe("frame");
    expect(element?.getAttribute("data-custom")).toBe("yes");
  });

  it("渲染 children", () => {
    const { container } = render(
      () => (
        <MessageScroller>
          <span data-testid="child">x</span>
        </MessageScroller>
      ),
      { wrapper: contextWrapper(fakeContext()) },
    );

    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});

describe("MessageScroller - data-scrollable", () => {
  it("两向都不可滚时属性缺失（方便用 ~= 选择器匹配）", () => {
    const { container } = renderFrame();

    expect(
      container
        .querySelector('[data-slot="message-scroller"]')
        ?.hasAttribute("data-scrollable"),
    ).toBe(false);
  });

  it("只能向上滚时是 start", () => {
    const { container } = renderFrame({ scrollableStart: () => true });

    expect(
      container
        .querySelector('[data-slot="message-scroller"]')
        ?.getAttribute("data-scrollable"),
    ).toBe("start");
  });

  it("两向都可滚时是 start end", () => {
    const { container } = renderFrame({
      scrollableStart: () => true,
      scrollableEnd: () => true,
    });

    expect(
      container
        .querySelector('[data-slot="message-scroller"]')
        ?.getAttribute("data-scrollable"),
    ).toBe("start end");
  });

  it("是响应式的：信号翻转后属性跟着变", () => {
    const [end, setEnd] = createSignal(false);
    const { container } = renderFrame({ scrollableEnd: end });
    const element = container.querySelector('[data-slot="message-scroller"]');

    expect(element?.hasAttribute("data-scrollable")).toBe(false);

    setEnd(true);
    expect(element?.getAttribute("data-scrollable")).toBe("end");

    setEnd(false);
    expect(element?.hasAttribute("data-scrollable")).toBe(false);
  });
});

describe("MessageScroller - 状态属性", () => {
  it("autoscrolling / pendingScroll 为真时输出空值属性", () => {
    const { container } = renderFrame({
      autoscrolling: () => true,
      pendingScroll: () => true,
    });
    const element = container.querySelector('[data-slot="message-scroller"]');

    expect(element?.getAttribute("data-autoscrolling")).toBe("");
    expect(element?.getAttribute("data-pending-scroll")).toBe("");
  });

  it("为假时属性缺失（而不是 false / 空串）", () => {
    const { container } = renderFrame({
      autoscrolling: () => false,
      pendingScroll: () => false,
    });
    const element = container.querySelector('[data-slot="message-scroller"]');

    expect(element?.hasAttribute("data-autoscrolling")).toBe(false);
    expect(element?.hasAttribute("data-pending-scroll")).toBe(false);
  });

  it("状态翻转后属性跟着出现与消失", () => {
    const [pending, setPending] = createSignal(true);
    const { container } = renderFrame({ pendingScroll: pending });
    const element = container.querySelector('[data-slot="message-scroller"]');

    expect(element?.hasAttribute("data-pending-scroll")).toBe(true);

    setPending(false);
    expect(element?.hasAttribute("data-pending-scroll")).toBe(false);
  });
});

describe("MessageScroller - 脱离 Provider", () => {
  it("抛中文错误", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(() => <MessageScroller />)).toThrow(
      /<MessageScroller> 必须渲染在 <MessageScrollerProvider> 内部/,
    );

    error.mockRestore();
  });
});
