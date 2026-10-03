import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type EngineOptions,
  addRow,
  addRowAtOffset,
  flushState,
  measured,
  renderEngine,
  setScrollMetrics,
  setupDom,
} from "~tests/components/message-scroller/test-utils";

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
