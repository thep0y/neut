import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { MessageScrollerContext } from "~/components/message-scroller/message-scroller.context";
import type { MessageScrollerContextValue } from "~/components/message-scroller/message-scroller.types";
import { scrollableData } from "~/components/message-scroller/message-scroller.utils";
import { useMessageScroller } from "~/components/message-scroller/useMessageScroller";
import { useMessageScrollerScrollable } from "~/components/message-scroller/useMessageScrollerScrollable";
import { useMessageScrollerVisibility } from "~/components/message-scroller/useMessageScrollerVisibility";

describe("scrollableData", () => {
  it("都不可滚时返回 undefined（属性从 DOM 上消失）", () => {
    expect(
      scrollableData(
        () => false,
        () => false,
      ),
    ).toBeUndefined();
  });

  it("只能向 start 滚时返回 start", () => {
    expect(
      scrollableData(
        () => true,
        () => false,
      ),
    ).toBe("start");
  });

  it("只能向 end 滚时返回 end", () => {
    expect(
      scrollableData(
        () => false,
        () => true,
      ),
    ).toBe("end");
  });

  it("两端都可滚时返回空格分隔的 start end", () => {
    expect(
      scrollableData(
        () => true,
        () => true,
      ),
    ).toBe("start end");
  });

  it("是响应式的：信号变化后重新求值", () => {
    const [start, setStart] = createSignal(false);
    const [end, setEnd] = createSignal(false);
    const data = () => scrollableData(start, end);

    expect(data()).toBeUndefined();

    setStart(true);
    expect(data()).toBe("start");

    setEnd(true);
    expect(data()).toBe("start end");

    setStart(false);
    setEnd(false);
    expect(data()).toBeUndefined();
  });
});

/** 构造一个假的 Context 值，只填被测 hook 用到的字段 */
function fakeContext(
  overrides: Partial<MessageScrollerContextValue> = {},
): MessageScrollerContextValue {
  return {
    viewport: () => undefined,
    setViewport: () => {},
    content: () => undefined,
    setContent: () => {},
    setSpacer: () => {},
    registerItem: () => () => {},
    preserveScrollOnPrepend: () => true,
    setPreserveScrollOnPrepend: () => {},
    scrollableStart: () => false,
    scrollableEnd: () => false,
    autoscrolling: () => false,
    pendingScroll: () => false,
    scrollToStart: () => true,
    scrollToEnd: () => true,
    scrollToMessage: () => true,
    currentAnchorId: () => null,
    visibleMessageIds: () => [],
    subscribeVisibility: () => () => {},
    options: (() => ({
      autoScroll: false,
      defaultScrollPosition: "end",
      scrollEdgeThreshold: 8,
      scrollMargin: 0,
      scrollPreviousItemPeek: 64,
    })) as MessageScrollerContextValue["options"],
    ...overrides,
  };
}

/** 在假 Provider 内渲染一个 hook */
function renderInContext<T>(
  useHook: () => T,
  value: MessageScrollerContextValue,
): { result: T } {
  return renderHook(useHook, {
    wrapper: (props) => (
      <MessageScrollerContext.Provider value={value}>
        {props.children}
      </MessageScrollerContext.Provider>
    ),
  });
}

describe("useMessageScroller", () => {
  it("转发三个滚动命令", () => {
    const scrollToStart = vi.fn(() => true);
    const scrollToEnd = vi.fn(() => true);
    const scrollToMessage = vi.fn(() => true);
    const { result } = renderInContext(
      useMessageScroller,
      fakeContext({ scrollToStart, scrollToEnd, scrollToMessage }),
    );

    expect(result.scrollToStart()).toBe(true);
    expect(result.scrollToEnd()).toBe(true);
    expect(result.scrollToMessage("m1")).toBe(true);
    expect(scrollToMessage).toHaveBeenCalledWith("m1");
  });

  it("脱离 Provider 使用时抛中文错误", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(useMessageScroller)).toThrow(
      "<useMessageScroller> 必须渲染在 <MessageScrollerProvider> 内部",
    );

    spy.mockRestore();
  });
});

describe("useMessageScrollerScrollable", () => {
  it("透传 start / end 信号", () => {
    const { result } = renderInContext(
      useMessageScrollerScrollable,
      fakeContext({ scrollableStart: () => true, scrollableEnd: () => false }),
    );

    expect(result.start()).toBe(true);
    expect(result.end()).toBe(false);
  });

  it("脱离 Provider 使用时抛中文错误", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(useMessageScrollerScrollable)).toThrow(
      "<useMessageScrollerScrollable> 必须渲染在 <MessageScrollerProvider> 内部",
    );

    spy.mockRestore();
  });
});

describe("useMessageScrollerVisibility", () => {
  it("挂载时订阅、卸载时退订", () => {
    const unsubscribe = vi.fn();
    const subscribeVisibility = vi.fn(() => unsubscribe);

    const view = renderHook(useMessageScrollerVisibility, {
      wrapper: (props) => (
        <MessageScrollerContext.Provider
          value={fakeContext({ subscribeVisibility })}
        >
          {props.children}
        </MessageScrollerContext.Provider>
      ),
    });

    expect(subscribeVisibility).toHaveBeenCalledTimes(1);
    expect(unsubscribe).not.toHaveBeenCalled();

    view.cleanup();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("透传 currentAnchorId 与 visibleMessageIds", () => {
    const { result } = renderInContext(
      useMessageScrollerVisibility,
      fakeContext({
        currentAnchorId: () => "turn-2",
        visibleMessageIds: () => ["m1", "m2"],
      }),
    );

    expect(result.currentAnchorId()).toBe("turn-2");
    expect(result.visibleMessageIds()).toEqual(["m1", "m2"]);
  });

  it("脱离 Provider 使用时抛中文错误", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(useMessageScrollerVisibility)).toThrow(
      "<useMessageScrollerVisibility> 必须渲染在 <MessageScrollerProvider> 内部",
    );

    spy.mockRestore();
  });
});
