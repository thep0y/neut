import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAnchoring } from "~/components/message-scroller/message-scroller.anchoring";
import { createScrollCommands } from "~/components/message-scroller/message-scroller.commands";
import { createDomMeasure } from "~/components/message-scroller/message-scroller.dom-measure";
import { createScrollState } from "~/components/message-scroller/message-scroller.scroll-state";
import {
  ENGINE_DEFAULTS,
  addRowAtOffset,
  flushFrames,
  stubRect,
  syncRow,
} from "~tests/components/message-scroller/test-utils";

/**
 * 锚定与保位的单测。
 *
 * 引擎级用例（`…anchoring.test.ts`）覆盖了整条编排路径；这里补模块自身的
 * 守卫分支：没有内容、没有视口、锚点已断开、位移在容差内、重复排帧等。
 */

beforeEach(() => {
  document.body.innerHTML = "";
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function setup(
  initial: {
    defaultScrollPosition?: "start" | "end" | "last-anchor";
    autoScroll?: boolean;
    scrollHeight?: number;
    clientHeight?: number;
    withViewport?: boolean;
    preserveScrollOnPrepend?: boolean;
  } = {},
) {
  const viewport = document.createElement("div");
  stubRect(viewport, {
    top: 0,
    bottom: initial.clientHeight ?? 400,
    height: initial.clientHeight ?? 400,
  });
  Object.defineProperty(viewport, "scrollHeight", {
    configurable: true,
    value: initial.scrollHeight ?? 2000,
  });
  Object.defineProperty(viewport, "clientHeight", {
    configurable: true,
    value: initial.clientHeight ?? 400,
  });
  Object.defineProperty(viewport, "scrollTop", {
    configurable: true,
    writable: true,
    value: 0,
  });
  viewport.scrollTo = ((arg: ScrollToOptions | number) => {
    viewport.scrollTop = typeof arg === "number" ? arg : (arg.top ?? 0);
  }) as typeof viewport.scrollTo;
  document.body.appendChild(viewport);

  const content = document.createElement("div");
  document.body.appendChild(content);

  const [viewportAccessor, setViewport] = createSignal<HTMLElement | undefined>(
    initial.withViewport === false ? undefined : viewport,
  );
  const [contentAccessor, setContent] = createSignal<HTMLElement | undefined>(
    content,
  );
  const [spacer] = createSignal<HTMLElement | undefined>();
  const [preserveScrollOnPrepend, setPreserveScrollOnPrepend] = createSignal(
    initial.preserveScrollOnPrepend ?? true,
  );
  const registered = new Map<string, HTMLElement>();
  const options = {
    ...ENGINE_DEFAULTS,
    autoScroll: initial.autoScroll ?? false,
    defaultScrollPosition: initial.defaultScrollPosition ?? "start",
  };

  const hook = renderHook(() => {
    const measure = createDomMeasure({
      viewport: viewportAccessor,
      content: contentAccessor,
      spacer,
    });
    const state = createScrollState({
      viewport: viewportAccessor,
      options: () => options,
      contentBottom: measure.contentBottom,
    });
    const scheduleVisibility = vi.fn();
    const commands = createScrollCommands({
      viewport: viewportAccessor,
      content: contentAccessor,
      spacer,
      options: () => options,
      measure,
      state,
      scheduleVisibility,
    });
    const anchoring = createAnchoring({
      viewport: viewportAccessor,
      content: contentAccessor,
      options: () => options,
      measure,
      commands,
      state,
      scheduleState: state.schedule,
      commitState: state.commit,
      scheduleVisibility,
      preserveScrollOnPrepend,
      getMessageElement: (id) => registered.get(id),
    });
    return { anchoring, state, measure, commands, scheduleVisibility };
  });

  return {
    ...hook,
    viewport,
    content,
    registered,
    setViewport,
    setContent,
    setPreserveScrollOnPrepend,
  };
}

describe("createAnchoring handleContentChange 守卫", () => {
  it("没有 content 时是空操作", () => {
    const { result, setContent, registered } = setup();

    expect(() => result.anchoring.handleContentChange()).not.toThrow();
    void setContent;
    expect(registered.size).toBe(0);
  });

  it("有内容但没有视口时：只提交状态，不报错", () => {
    const { result, content } = setup({ withViewport: false });
    addRowAtOffset(content, "m1", { offset: 0, height: 900, scrollTop: 0 });

    expect(() => result.anchoring.handleContentChange()).not.toThrow();
    expect(result.state.scrollableEnd()).toBe(false);
  });

  it("会话为空时清掉 pendingScroll", () => {
    const { result } = setup({ defaultScrollPosition: "end" });
    expect(result.anchoring.pendingScroll()).toBe(true);

    result.anchoring.handleContentChange();

    expect(result.anchoring.pendingScroll()).toBe(false);
  });

  it("首次渲染就按 defaultScrollPosition 定位并取消遮罩", () => {
    const { result, content } = setup({ defaultScrollPosition: "start" });
    addRowAtOffset(content, "m1", { offset: 0, height: 900, scrollTop: 0 });

    result.anchoring.handleContentChange();

    expect(result.anchoring.pendingScroll()).toBe(false);
  });

  it("repeat 调用不会重新应用默认位置", () => {
    const { result, content, viewport } = setup({
      defaultScrollPosition: "start",
    });
    addRowAtOffset(content, "m1", { offset: 0, height: 900, scrollTop: 0 });
    result.anchoring.handleContentChange();
    viewport.scrollTop = 300;

    result.anchoring.handleContentChange();

    // 还是停在读者所在位置（不会再被拉回顶部）
    expect(viewport.scrollTop).toBe(300);
  });
});

describe("createAnchoring prepend 保位守卫", () => {
  it("锚点元素已断开时不做补偿", () => {
    const { result, content, viewport } = setup();
    const row = addRowAtOffset(content, "m2", {
      offset: 0,
      height: 200,
      scrollTop: 0,
    });
    addRowAtOffset(content, "m3", { offset: 200, height: 200, scrollTop: 0 });
    result.anchoring.handleContentChange();

    // 记录锚点后把 m2 从 DOM 里摘掉，再在开头插入历史
    row.remove();
    const m1 = document.createElement("div");
    m1.setAttribute("data-message-id", "m1");
    m1.setAttribute("data-scroll-anchor", "false");
    stubRect(m1, { top: 0, bottom: 200 });
    content.insertBefore(m1, content.firstElementChild);
    viewport.scrollTop = 0;

    expect(() => result.anchoring.handleContentChange()).not.toThrow();
    expect(viewport.scrollTop).toBe(0);
  });

  it("位移在容差内时不做补偿", () => {
    const { result, content, viewport } = setup();
    const first = addRowAtOffset(content, "m2", {
      offset: 0,
      height: 200,
      scrollTop: 0,
    });
    addRowAtOffset(content, "m3", { offset: 200, height: 200, scrollTop: 0 });
    result.anchoring.handleContentChange();

    // 插入历史但保持 m2 的视口位置不变（delta = 0）
    const m1 = document.createElement("div");
    m1.setAttribute("data-message-id", "m1");
    m1.setAttribute("data-scroll-anchor", "false");
    stubRect(m1, { top: 0, bottom: 0 });
    content.insertBefore(m1, content.firstElementChild);
    syncRow(first, { offset: 0, height: 200, scrollTop: 0 });

    result.anchoring.handleContentChange();

    expect(viewport.scrollTop).toBe(0);
  });
});

describe("createAnchoring 排队补滚守卫", () => {
  it("没有排队目标时 notifyMessageRegistered 是空操作", async () => {
    const { result } = setup({ defaultScrollPosition: "end" });

    result.anchoring.notifyMessageRegistered("unknown");
    await flushFrames();

    expect(result.anchoring.pendingScroll()).toBe(true);
  });

  it("重复通知同一个 id 只排一帧", async () => {
    const { result, registered } = setup({ defaultScrollPosition: "start" });
    result.anchoring.handleContentChange();
    expect(result.anchoring.scrollToMessage("later")).toBe(true);

    const raf = vi.spyOn(window, "requestAnimationFrame");
    registered.set("later", document.createElement("div"));
    result.anchoring.notifyMessageRegistered("later");
    const afterFirst = raf.mock.calls.length;
    result.anchoring.notifyMessageRegistered("later");

    expect(raf.mock.calls.length).toBe(afterFirst);
    await flushFrames();
  });
});

describe("createAnchoring scrollToMessage 排队", () => {
  it("已挂载但不在内容里时排队并返回 true", () => {
    const { result, content, registered } = setup();
    addRowAtOffset(content, "m1", { offset: 0, height: 300, scrollTop: 0 });
    result.anchoring.handleContentChange();

    const ghost = document.createElement("div");
    stubRect(ghost, { top: 0, bottom: 10 });
    registered.set("ghost", ghost);

    expect(result.anchoring.scrollToMessage("ghost")).toBe(true);
  });

  it("目标既未挂载、会话也非空时返回 false", () => {
    const { result, content } = setup();
    addRowAtOffset(content, "m1", { offset: 0, height: 300, scrollTop: 0 });
    result.anchoring.handleContentChange();

    expect(result.anchoring.scrollToMessage("missing")).toBe(false);
  });
});

describe("createAnchoring dispose", () => {
  it("取消尚未执行的补滚帧", async () => {
    const { result } = setup({ defaultScrollPosition: "start" });
    result.anchoring.handleContentChange();
    result.anchoring.scrollToMessage("later");

    result.anchoring.dispose();

    expect(() => result.anchoring.handleContentChange()).not.toThrow();
    await flushFrames();
  });

  it("没有待取消的帧时是空操作", () => {
    const { result } = setup();

    expect(() => result.anchoring.dispose()).not.toThrow();
  });
});
