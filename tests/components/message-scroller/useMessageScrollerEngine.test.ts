import { renderHook } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useMessageScrollerEngine } from "~/components/message-scroller/useMessageScrollerEngine";
import type { MessageScrollerProviderProps } from "~/components/message-scroller/message-scroller.types";

/**
 * jsdom 不做布局：所有 `getBoundingClientRect()` 恒为 0、`scrollHeight`/`clientHeight`
 * 恒为 0。滚动引擎的核心算法都建立在真实测量之上，因此这里显式 stub 这些 API，
 * 用一个"可控的坐标系"来驱动引擎（TESTING.md §4.5：只 mock 系统边界）。
 */

type EngineOptions = Required<Omit<MessageScrollerProviderProps, "children">>;

/**
 * 与 `MessageScrollerProvider` 的 `mergeProps` 默认值保持一致。
 * 默认值定义在 Provider 里（引擎本身要求调用方给全），因此测试侧显式复刻一份；
 * 若哪天 Provider 改了默认值，这里的断言会提醒同步（TESTING.md §7 文档联动）。
 */
const ENGINE_DEFAULTS: EngineOptions = {
  autoScroll: false,
  defaultScrollPosition: "end",
  scrollEdgeThreshold: 8,
  scrollMargin: 0,
  scrollPreviousItemPeek: 64,
};

/** 让元素报告指定矩形，并把它挂到 body */
function measured(
  el: HTMLElement,
  rect: { top: number; bottom: number; height?: number },
): HTMLElement {
  el.getBoundingClientRect = () =>
    ({
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height ?? rect.bottom - rect.top,
      left: 0,
      right: 0,
      width: 0,
      x: 0,
      y: rect.top,
      toJSON: () => ({}),
    }) as DOMRect;
  document.body.appendChild(el);
  return el;
}

/** 设置滚动容器的可滚动尺寸 */
function setScrollMetrics(
  el: HTMLElement,
  {
    scrollHeight,
    clientHeight,
  }: { scrollHeight: number; clientHeight: number },
) {
  Object.defineProperty(el, "scrollHeight", {
    configurable: true,
    value: scrollHeight,
  });
  Object.defineProperty(el, "clientHeight", {
    configurable: true,
    value: clientHeight,
  });
}

/** 构造一个可控的 viewport + content */
function setupDom(options: { scrollTop?: number } = {}) {
  const viewport = document.createElement("div");
  const content = document.createElement("div");
  setScrollMetrics(viewport, { scrollHeight: 1000, clientHeight: 400 });
  Object.defineProperty(viewport, "scrollTop", {
    configurable: true,
    writable: true,
    value: options.scrollTop ?? 0,
  });
  measured(viewport, { top: 0, bottom: 400 });

  const scrollToCalls: Array<{ top: number; behavior?: string }> = [];
  viewport.scrollTo = ((arg: ScrollToOptions | number) => {
    const top = typeof arg === "number" ? arg : (arg.top ?? 0);
    scrollToCalls.push({
      top,
      behavior: typeof arg === "number" ? undefined : arg.behavior,
    });
    viewport.scrollTop = top;
  }) as typeof viewport.scrollTo;

  viewport.appendChild(content);
  document.body.appendChild(viewport);

  return { viewport, content, scrollToCalls };
}

/** 往 content 里加一个"行" */
function addRow(
  content: HTMLElement,
  id: string,
  rect: { top: number; bottom: number },
  anchor = false,
): HTMLElement {
  const row = document.createElement("div");
  row.setAttribute("data-message-id", id);
  if (anchor) row.setAttribute("data-scroll-anchor", "");
  measured(row, rect);
  content.appendChild(row);
  return row;
}

/**
 * 加一行，并让它的视口矩形与 `scrollTop` **自洽**。
 *
 * 引擎里 `itemOffsetTop = rect.top - vpRect.top + vp.scrollTop`，
 * 其中 `vpRect.top` 固定为 0。因此一个「内容偏移 offset、高 height」的行
 * 在视口中的 top 应为 `offset - scrollTop`。手写 rect 很容易和 scrollTop 对不上，
 * 导致算出的可滚动状态与预期不符；这个 helper 把换算固定下来。
 */
function addRowAtOffset(
  content: HTMLElement,
  id: string,
  opts: { offset: number; height: number; scrollTop: number },
): HTMLElement {
  const top = opts.offset - opts.scrollTop;
  return addRow(content, id, { top, bottom: top + opts.height });
}

function renderEngine(overrides: Partial<EngineOptions> = {}) {
  return renderHook(() =>
    useMessageScrollerEngine(() => ({ ...ENGINE_DEFAULTS, ...overrides })),
  );
}

describe("useMessageScrollerEngine - 基础接线", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("初始没有 viewport / content 时不可滚动", () => {
    const { result, cleanup } = renderEngine();

    expect(result.viewport()).toBeUndefined();
    expect(result.scrollableStart()).toBe(false);
    expect(result.scrollableEnd()).toBe(false);

    cleanup();
  });

  it("setViewport / setContent 后 accessor 反映出来", () => {
    const { viewport, content } = setupDom();
    const { result, cleanup } = renderEngine();

    result.setViewport(viewport);
    result.setContent(content);

    expect(result.viewport()).toBe(viewport);
    expect(result.content()).toBe(content);

    cleanup();
  });

  it("options 原样透出", () => {
    const { result, cleanup } = renderEngine({ scrollEdgeThreshold: 12 });

    expect(result.options().scrollEdgeThreshold).toBe(12);

    cleanup();
  });

  it("defaultScrollPosition 非 start 时 pendingScroll 初始为 true", () => {
    const { result, cleanup } = renderEngine({ defaultScrollPosition: "end" });

    expect(result.pendingScroll()).toBe(true);

    cleanup();
  });

  it("defaultScrollPosition=start 时 pendingScroll 初始为 false", () => {
    const { result, cleanup } = renderEngine({
      defaultScrollPosition: "start",
    });

    expect(result.pendingScroll()).toBe(false);

    cleanup();
  });

  it("未挂载 viewport 时 scrollToStart / scrollToEnd 返回 false", () => {
    const { result, cleanup } = renderEngine();

    expect(result.scrollToStart()).toBe(false);
    expect(result.scrollToEnd()).toBe(false);

    cleanup();
  });

  it("会话为空时 scrollToMessage 会排队并返回 true（永久链接场景）", () => {
    const { result, cleanup } = renderEngine();

    // 一行都没挂载时，引擎把请求排队，等行出现后再跳转 ——
    // 这是客户端解析永久链接的路径，因此返回 true 而不是 false。
    expect(result.scrollToMessage("m1")).toBe(true);

    cleanup();
  });

  it("已挂载行但目标不存在时 scrollToMessage 返回 false", async () => {
    const { viewport, content } = setupDom();
    const { result, cleanup } = renderEngine();
    result.setViewport(viewport);
    result.setContent(content);

    // itemCount 取自 content 的子元素；`handleContentChange` 跑在 createEffect 里，
    // 因此需要让 effect 先执行一轮再把 itemCount 收敛到 1。
    addRow(content, "existing", { top: 0, bottom: 50 });
    await Promise.resolve();

    expect(result.scrollToMessage("missing")).toBe(false);

    cleanup();
  });

  it("初始没有可见消息与锚点", () => {
    const { result, cleanup } = renderEngine();

    expect(result.visibleMessageIds()).toEqual([]);
    expect(result.currentAnchorId()).toBeNull();

    cleanup();
  });

  it("初始不在 autoscrolling 状态", () => {
    const { result, cleanup } = renderEngine();

    expect(result.autoscrolling()).toBe(false);

    cleanup();
  });
});

describe("useMessageScrollerEngine - 可滚动状态", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  /** 让引擎完成一次状态提交（内部走 requestAnimationFrame） */
  async function flushState() {
    await vi.advanceTimersByTimeAsync(0);
  }

  /**
   * 通用脚手架：内容一行（offset 0、高 900），容器 400 高。
   *
   * 注意 `defaultScrollPosition` 无论取哪个值都会**首次定位一次**
   * （`start` → `scrollToStart` 会把 scrollTop 归零，`end` → 滚到底），
   * 因此不能指望构造时就设定好的 scrollTop 保留下来。
   * 这里先让首次定位跑完，再把 scrollTop 设到目标值并触发一次状态提交。
   */
  async function scrollableAt(scrollTop: number) {
    const { viewport, content, scrollToCalls } = setupDom({ scrollTop: 0 });
    addRowAtOffset(content, "m1", { offset: 0, height: 900, scrollTop: 0 });

    const { result, cleanup } = renderEngine({
      defaultScrollPosition: "start",
    });
    result.setViewport(viewport);
    result.setContent(content);
    await flushState();

    // 首次定位已完成，现在把视口挪到目标位置
    viewport.scrollTop = scrollTop;
    // 行的视口矩形要跟着 scrollTop 变（保持自洽）
    content.firstElementChild!.getBoundingClientRect = () =>
      ({
        top: -scrollTop,
        bottom: 900 - scrollTop,
        height: 900,
        left: 0,
        right: 0,
        width: 0,
        x: 0,
        y: -scrollTop,
        toJSON: () => ({}),
      }) as DOMRect;
    viewport.dispatchEvent(new Event("scroll"));
    await flushState();

    return { result, cleanup, viewport, scrollToCalls };
  }

  it("内容放得下时两个方向都不可滚", async () => {
    const { viewport, content } = setupDom();
    // 内容只有 200 高、容器 400 高 => 无需滚动
    setScrollMetrics(viewport, { scrollHeight: 400, clientHeight: 400 });
    addRowAtOffset(content, "m1", { offset: 0, height: 200, scrollTop: 0 });

    const { result, cleanup } = renderEngine({
      defaultScrollPosition: "start",
    });
    result.setViewport(viewport);
    result.setContent(content);
    await flushState();

    expect(result.scrollableStart()).toBe(false);
    expect(result.scrollableEnd()).toBe(false);

    cleanup();
  });

  it("内容超出且停在顶部时只能向下滚", async () => {
    const { result, cleanup } = await scrollableAt(0);

    expect(result.scrollableStart()).toBe(false);
    expect(result.scrollableEnd()).toBe(true);

    cleanup();
  });

  it("滚到中间时两个方向都可滚", async () => {
    const { result, cleanup } = await scrollableAt(300);

    expect(result.scrollableStart()).toBe(true);
    expect(result.scrollableEnd()).toBe(true);

    cleanup();
  });

  it("滚到底部时只能向上滚", async () => {
    // maxScrollTop = 1000 - 400 = 600
    const { result, cleanup } = await scrollableAt(600);

    expect(result.scrollableStart()).toBe(true);
    expect(result.scrollableEnd()).toBe(false);

    cleanup();
  });

  it("scrollEdgeThreshold 内不算可向上滚", async () => {
    // 阈值 8 > scrollTop 5 => 仍算在顶部
    const { result, cleanup } = await scrollableAt(5);

    expect(result.scrollableStart()).toBe(false);

    cleanup();
  });

  it("超过阈值时算可向上滚", async () => {
    const { result, cleanup } = await scrollableAt(20);

    expect(result.scrollableStart()).toBe(true);

    cleanup();
  });

  it("autoScroll 跟随时对 UI 隐藏「还能向下滚」", async () => {
    const { viewport, content } = setupDom({ scrollTop: 600 });
    addRowAtOffset(content, "m1", { offset: 0, height: 900, scrollTop: 600 });

    // autoScroll=true 且停在尾部 => following-bottom => end 对 UI 隐藏
    const { result, cleanup } = renderEngine({ autoScroll: true });
    result.setViewport(viewport);
    result.setContent(content);
    await flushState();

    expect(result.scrollableEnd()).toBe(false);

    cleanup();
  });

  it("spacer 不计入内容底部（滚动状态只看真实内容）", async () => {
    const { viewport, content } = setupDom({ scrollTop: 0 });
    addRowAtOffset(content, "m1", { offset: 0, height: 300, scrollTop: 0 });

    const { result, cleanup } = renderEngine({
      defaultScrollPosition: "start",
    });
    result.setViewport(viewport);
    result.setContent(content);

    // 挂一个很高的 spacer；若它被计入 end 就会变 true
    const spacer = document.createElement("div");
    measured(spacer, { top: 300, bottom: 3000 });
    content.appendChild(spacer);
    result.setSpacer(spacer);
    await flushState();

    // 真实内容 300 < 400 => 放得下
    expect(result.scrollableEnd()).toBe(false);

    cleanup();
  });
});

describe("useMessageScrollerEngine - 滚动方法", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  async function flushState() {
    await vi.advanceTimersByTimeAsync(0);
  }

  /** 建立 viewport + 一行内容并完成首次定位 */
  async function mount(options: Partial<EngineOptions> = {}) {
    const { viewport, content, scrollToCalls } = setupDom({ scrollTop: 300 });
    addRowAtOffset(content, "m1", { offset: 0, height: 900, scrollTop: 300 });

    const { result, cleanup } = renderEngine({
      defaultScrollPosition: "start",
      ...options,
    });
    result.setViewport(viewport);
    result.setContent(content);
    await flushState();

    return { result, cleanup, viewport, content, scrollToCalls };
  }

  it("scrollToStart 把视口滚到 0 并返回 true", async () => {
    const { result, cleanup, viewport } = await mount();

    expect(result.scrollToStart()).toBe(true);
    await flushState();

    expect(viewport.scrollTop).toBe(0);

    cleanup();
  });

  it("scrollToStart 后可向上滚状态复位", async () => {
    const { result, cleanup, viewport, content } = await mount();

    // 把视口挪到中间并刷新状态，确认此时确实可向上滚
    viewport.scrollTop = 300;
    content.firstElementChild!.getBoundingClientRect = () =>
      ({
        top: -300,
        bottom: 600,
        height: 900,
        left: 0,
        right: 0,
        width: 0,
        x: 0,
        y: -300,
        toJSON: () => ({}),
      }) as DOMRect;
    viewport.dispatchEvent(new Event("scroll"));
    await flushState();
    expect(result.scrollableStart()).toBe(true);

    result.scrollToStart();
    await flushState();

    // scrollToStart 把 scrollTop 归零；行的视口矩形要同步成"未滚动"状态，
    // 否则引擎会读到陈旧的 rect 而算错可滚动状态。
    content.firstElementChild!.getBoundingClientRect = () =>
      ({
        top: 0,
        bottom: 900,
        height: 900,
        left: 0,
        right: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    viewport.dispatchEvent(new Event("scroll"));
    await flushState();

    expect(result.scrollableStart()).toBe(false);

    cleanup();
  });

  it("scrollToEnd 把视口滚到最大位置", async () => {
    const { result, cleanup, viewport } = await mount();

    expect(result.scrollToEnd()).toBe(true);
    await flushState();

    // maxScrollTop = 1000 - 400 = 600
    expect(viewport.scrollTop).toBe(600);

    cleanup();
  });

  it("scrollToEnd 支持 smooth 行为", async () => {
    const { result, cleanup, scrollToCalls } = await mount();

    result.scrollToEnd({ behavior: "smooth" });
    await flushState();

    expect(scrollToCalls.at(-1)).toMatchObject({
      top: 600,
      behavior: "smooth",
    });

    cleanup();
  });

  it("scrollToEnd 会开启 autoscrolling（随后自动关闭）", async () => {
    const { result, cleanup } = await mount();

    result.scrollToEnd();
    expect(result.autoscrolling()).toBe(true);

    // AUTO_SCROLLING_TIMEOUT_MS = 180
    await vi.advanceTimersByTimeAsync(200);

    expect(result.autoscrolling()).toBe(false);

    cleanup();
  });

  it("scrollToStart 不触发 autoscrolling", async () => {
    const { result, cleanup } = await mount();

    result.scrollToStart();

    expect(result.autoscrolling()).toBe(false);

    cleanup();
  });

  it("viewport 被移除后 scrollToStart 返回 false", async () => {
    const { result, cleanup } = await mount();
    result.setViewport(undefined);

    expect(result.scrollToStart()).toBe(false);

    cleanup();
  });

  it("viewport 被移除后 scrollToEnd 返回 false", async () => {
    const { result, cleanup } = await mount();
    result.setViewport(undefined);

    expect(result.scrollToEnd()).toBe(false);

    cleanup();
  });
});
