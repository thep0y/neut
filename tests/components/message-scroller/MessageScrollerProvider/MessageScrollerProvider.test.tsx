import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { MessageScrollerProvider } from "~/components/message-scroller/MessageScrollerProvider/MessageScrollerProvider";
import { useMessageScrollerContext } from "~/components/message-scroller/message-scroller.context";
import type { MessageScrollerContextValue } from "~/components/message-scroller/message-scroller.types";

/**
 * provider 不渲染 DOM：它把 props 合并出默认值、交给引擎，并提供 context。
 * 这里用一个探针组件读回 context，验证默认值、透传与「同一 Provider 内共享实例」。
 */
function renderProvider(
  props: Parameters<typeof MessageScrollerProvider>[0] = {},
) {
  const captured: MessageScrollerContextValue[] = [];
  const Probe = () => {
    captured.push(useMessageScrollerContext("Probe"));
    return <span data-testid="probe" />;
  };

  const result = render(() => (
    <MessageScrollerProvider {...props}>
      <Probe />
    </MessageScrollerProvider>
  ));

  return { ...result, ctx: () => captured.at(-1)! };
}

describe("MessageScrollerProvider - 默认值", () => {
  it("不传任何 prop 时使用引擎默认值", () => {
    const { ctx } = renderProvider();

    expect(ctx().options()).toEqual({
      autoScroll: false,
      defaultScrollPosition: "end",
      scrollEdgeThreshold: 8,
      scrollMargin: 0,
      scrollPreviousItemPeek: 64,
    });
  });

  it("props 覆盖默认值", () => {
    const { ctx } = renderProvider({
      autoScroll: true,
      defaultScrollPosition: "start",
      scrollEdgeThreshold: 24,
      scrollMargin: 12,
      scrollPreviousItemPeek: 8,
    });

    expect(ctx().options()).toEqual({
      autoScroll: true,
      defaultScrollPosition: "start",
      scrollEdgeThreshold: 24,
      scrollMargin: 12,
      scrollPreviousItemPeek: 8,
    });
  });

  it("defaultScrollPosition 影响初始 pendingScroll（start 不需要遮罩）", () => {
    expect(
      renderProvider({ defaultScrollPosition: "start" }).ctx().pendingScroll(),
    ).toBe(false);
    expect(
      renderProvider({ defaultScrollPosition: "end" }).ctx().pendingScroll(),
    ).toBe(true);
    expect(
      renderProvider({ defaultScrollPosition: "last-anchor" })
        .ctx()
        .pendingScroll(),
    ).toBe(true);
  });
});

describe("MessageScrollerProvider - context", () => {
  it("渲染 children（不额外包 DOM）", () => {
    const { getByTestId } = renderProvider();

    expect(getByTestId("probe")).toBeInTheDocument();
  });

  it("同一 Provider 内的多个消费者共享同一个引擎实例", () => {
    const contexts: MessageScrollerContextValue[] = [];
    const Consumer = () => {
      contexts.push(useMessageScrollerContext("Consumer"));
      return null;
    };

    render(() => (
      <MessageScrollerProvider>
        <Consumer />
        <Consumer />
      </MessageScrollerProvider>
    ));

    expect(contexts).toHaveLength(2);
    expect(contexts[0]).toBe(contexts[1]);
  });

  it("初始没有任何元素挂上（viewport / content 为空）", () => {
    const { ctx } = renderProvider();

    expect(ctx().viewport()).toBeUndefined();
    expect(ctx().content()).toBeUndefined();
    expect(ctx().scrollableStart()).toBe(false);
    expect(ctx().scrollableEnd()).toBe(false);
    expect(ctx().autoscrolling()).toBe(false);
    expect(ctx().currentAnchorId()).toBeNull();
    expect(ctx().visibleMessageIds()).toEqual([]);
  });

  it("暴露滚动命令（未挂载视口时返回 false / 不抛错）", () => {
    const { ctx } = renderProvider();

    expect(ctx().scrollToStart()).toBe(false);
    expect(ctx().scrollToEnd()).toBe(false);
    expect(() => ctx().scrollToMessage("m1")).not.toThrow();
  });

  it("setViewport / setContent 会反映到 accessor", () => {
    const { ctx } = renderProvider();
    const viewport = document.createElement("div");
    const content = document.createElement("div");

    ctx().setViewport(viewport);
    ctx().setContent(content);

    expect(ctx().viewport()).toBe(viewport);
    expect(ctx().content()).toBe(content);
  });

  it("preserveScrollOnPrepend 默认 true 且可切换", () => {
    const { ctx } = renderProvider();

    expect(ctx().preserveScrollOnPrepend()).toBe(true);

    ctx().setPreserveScrollOnPrepend(false);
    expect(ctx().preserveScrollOnPrepend()).toBe(false);
  });

  it("autoScroll 影响滚动模式：跟随时追加内容会自动到底（集成视角）", async () => {
    // 这一条的详细行为由引擎用例覆盖；这里只确认 Provider 把 prop 传到了引擎
    const { ctx } = renderProvider({ autoScroll: true });

    expect(ctx().options().autoScroll).toBe(true);
  });
});

describe("MessageScrollerProvider - props 响应式", () => {
  it("defaultScrollPosition 变化时引擎读到的 options 跟着变", () => {
    const [position, setPosition] = createSignal<"start" | "end">("end");
    const captured: MessageScrollerContextValue[] = [];
    const Probe = () => {
      captured.push(useMessageScrollerContext("Probe"));
      return null;
    };

    render(() => (
      <MessageScrollerProvider defaultScrollPosition={position()}>
        <Probe />
      </MessageScrollerProvider>
    ));

    expect(captured.at(-1)?.options().defaultScrollPosition).toBe("end");

    setPosition("start");
    expect(captured.at(-1)?.options().defaultScrollPosition).toBe("start");
  });

  it("options 是 accessor：读取时才求值", () => {
    const { ctx } = renderProvider({ scrollEdgeThreshold: 5 });

    expect(typeof ctx().options).toBe("function");
    expect(ctx().options().scrollEdgeThreshold).toBe(5);
  });
});

describe("MessageScrollerProvider - 卸载", () => {
  it("卸载时不抛错（内部清理定时器与观察器）", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { unmount } = renderProvider();

    expect(() => unmount()).not.toThrow();

    error.mockRestore();
  });
});
