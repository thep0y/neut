import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addRowAtOffset,
  flushState,
  measured,
  renderEngine,
  setupDom,
  stubResizeObserver,
  syncRow,
} from "~tests/components/message-scroller/test-utils";

/**
 * 引擎的「跟随 / 让位 / 命令 / spacer」行为。
 *
 * 这些用例按 REFACTOR-PLAN.md §4 b-c 编写：先固定行为，再把实现拆成
 * `scroll-state`（块 A）与 `commands`（块 B）——拆分时它们必须保持全绿。
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

/**
 * 内容 900 高、容器 400 高 → maxScrollTop = 600。
 * `defaultScrollPosition: "start"` 先把首次定位跑完，之后由用例自己摆位置。
 */
async function mount(
  options: {
    autoScroll?: boolean;
    scrollHeight?: number;
    clientHeight?: number;
  } = {},
) {
  const dom = setupDom({
    scrollTop: 0,
    scrollHeight: options.scrollHeight ?? 1000,
    clientHeight: options.clientHeight ?? 400,
  });
  const row = addRowAtOffset(dom.content, "m1", {
    offset: 0,
    height: 900,
    scrollTop: 0,
  });
  const hook = renderEngine({
    defaultScrollPosition: "start",
    autoScroll: options.autoScroll ?? false,
  });
  hook.result.setViewport(dom.viewport);
  hook.result.setContent(dom.content);
  hook.result.registerItem({ id: "m1", element: row });
  await flushState();
  return { ...hook, row, ...dom };
}

/** 把视口挪到指定位置，并让已注册的行矩形与之自洽，然后通知一次滚动 */
async function scrollTo(
  fixture: Awaited<ReturnType<typeof mount>>,
  top: number,
) {
  fixture.viewport.scrollTop = top;
  syncRow(fixture.row, { offset: 0, height: 900, scrollTop: top });
  fixture.viewport.dispatchEvent(new Event("scroll"));
  await flushState();
}

describe("useMessageScrollerEngine - 跟随与让位", () => {
  it("autoScroll 关闭时：追加内容不跟着滚", async () => {
    const fixture = await mount({ autoScroll: false });
    await scrollTo(fixture, 600);
    expect(fixture.viewport.scrollTop).toBe(600);

    addRowAtOffset(fixture.content, "m2", {
      offset: 900,
      height: 300,
      scrollTop: 600,
    });
    await flushState();

    expect(fixture.viewport.scrollTop).toBe(600);
    fixture.cleanup();
  });

  it("autoScroll 开启且停在实时边缘时：追加内容跟到新底部", async () => {
    const fixture = await mount({ autoScroll: true, scrollHeight: 1300 });
    await scrollTo(fixture, 600);
    // 跟随时对 UI 隐藏「还能向下滚」
    expect(fixture.result.scrollableEnd()).toBe(false);

    addRowAtOffset(fixture.content, "m2", {
      offset: 900,
      height: 300,
      scrollTop: 600,
    });
    await flushState();

    // 新 maxScrollTop = 1300 - 400 = 900
    expect(fixture.viewport.scrollTop).toBe(900);
    fixture.cleanup();
  });

  it("上移离开底部后放弃跟随，并把「还能向下滚」暴露出来", async () => {
    const fixture = await mount({ autoScroll: true, scrollHeight: 1300 });
    await scrollTo(fixture, 600);

    await scrollTo(fixture, 300);

    expect(fixture.result.scrollableEnd()).toBe(true);
    fixture.cleanup();
  });

  it("autoscrolling 期间的上移不会放弃跟随", async () => {
    const fixture = await mount({ autoScroll: true, scrollHeight: 1300 });
    fixture.result.scrollToEnd();
    expect(fixture.result.autoscrolling()).toBe(true);

    await scrollTo(fixture, 300);

    // 仍在 following-bottom：end 继续被隐藏
    expect(fixture.result.scrollableEnd()).toBe(false);
    fixture.cleanup();
  });

  it("滚轮让位后不再跟随新内容", async () => {
    const fixture = await mount({ autoScroll: true, scrollHeight: 1300 });
    await scrollTo(fixture, 600);

    fixture.viewport.dispatchEvent(new Event("wheel"));
    addRowAtOffset(fixture.content, "m2", {
      offset: 900,
      height: 300,
      scrollTop: 600,
    });
    await flushState();

    expect(fixture.viewport.scrollTop).toBe(600);
    fixture.cleanup();
  });

  it("触摸移动与键盘滚动键同样让位", async () => {
    const fixture = await mount({ autoScroll: true, scrollHeight: 1300 });
    await scrollTo(fixture, 600);

    fixture.viewport.dispatchEvent(new Event("touchmove"));
    fixture.viewport.dispatchEvent(
      new KeyboardEvent("keydown", { key: "PageDown" }),
    );
    addRowAtOffset(fixture.content, "m2", {
      offset: 900,
      height: 300,
      scrollTop: 600,
    });
    await flushState();

    expect(fixture.viewport.scrollTop).toBe(600);
    fixture.cleanup();
  });

  it("非滚动键不会让位", async () => {
    const fixture = await mount({ autoScroll: true, scrollHeight: 1300 });
    await scrollTo(fixture, 600);

    fixture.viewport.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab" }),
    );
    addRowAtOffset(fixture.content, "m2", {
      offset: 900,
      height: 300,
      scrollTop: 600,
    });
    await flushState();

    expect(fixture.viewport.scrollTop).toBe(900);
    fixture.cleanup();
  });

  it("让位会立即清掉 autoscrolling 计时器", async () => {
    const fixture = await mount({ autoScroll: true });
    fixture.result.scrollToEnd();
    expect(fixture.result.autoscrolling()).toBe(true);

    await vi.advanceTimersByTimeAsync(100);
    expect(fixture.result.autoscrolling()).toBe(true);

    // 滚轮让位：applyAutoscrolling(false) 走 clearTimeout 分支
    fixture.viewport.dispatchEvent(new Event("wheel"));

    expect(fixture.result.autoscrolling()).toBe(false);
    // 原先的定时器已清掉，越过 180ms 也不会再改状态
    await vi.advanceTimersByTimeAsync(200);
    expect(fixture.result.autoscrolling()).toBe(false);
    fixture.cleanup();
  });

  it("恰好等于 scrollEdgeThreshold 不算「还能向下滚」", async () => {
    // 内容底部 = 808，容器 400、scrollTop 400 → 差值 8 = 阈值
    const fixture = await mount({ clientHeight: 400, scrollHeight: 808 });
    // 换一行 808 高的内容
    fixture.row.remove();
    const tall = addRowAtOffset(fixture.content, "m1", {
      offset: 0,
      height: 808,
      scrollTop: 400,
    });
    fixture.result.registerItem({ id: "m1", element: tall });
    await scrollTo(fixture, 400);

    expect(fixture.result.scrollableEnd()).toBe(false);

    // 再多 1px 就越过阈值
    syncRow(tall, { offset: 0, height: 809, scrollTop: 400 });
    fixture.viewport.dispatchEvent(new Event("scroll"));
    await flushState();

    expect(fixture.result.scrollableEnd()).toBe(true);
    fixture.cleanup();
  });
});

describe("useMessageScrollerEngine - 命令与 spacer", () => {
  it("已在目标位置时直接赋值，不发起动画滚动（0.5px 容差）", async () => {
    const fixture = await mount();
    expect(fixture.viewport.scrollTop).toBe(0);

    expect(fixture.result.scrollToStart()).toBe(true);

    expect(fixture.scrollToCalls).toHaveLength(0);
    fixture.cleanup();
  });

  it("需要移动时才发起滚动", async () => {
    const fixture = await mount();
    await scrollTo(fixture, 300);
    fixture.scrollToCalls.length = 0;

    expect(fixture.result.scrollToStart()).toBe(true);

    expect(fixture.scrollToCalls).toEqual([{ top: 0, behavior: "auto" }]);
    fixture.cleanup();
  });

  it("scrollToElement 按需设置尾部 spacer", async () => {
    const fixture = await mount();
    const spacer = document.createElement("div");
    fixture.content.appendChild(spacer);
    fixture.result.setSpacer(spacer);

    // 第二行放在内容末尾（offset 900、高 200 → 内容底部 1100）
    const last = addRowAtOffset(fixture.content, "m2", {
      offset: 900,
      height: 200,
      scrollTop: 0,
    });
    fixture.result.registerItem({ id: "m2", element: last });

    expect(fixture.result.scrollToMessage("m2", { align: "start" })).toBe(true);

    // spacer = target(900) + clientHeight(400) - contentBottom(1100) = 200
    expect(spacer.hidden).toBe(false);
    expect(spacer.style.height).toBe("200px");
    fixture.cleanup();
  });

  it("scrollToElement 的负 margin 抵消 content 行间距", async () => {
    const fixture = await mount();
    // content 的 row-gap 由 computed style 决定（jsdom 不做布局，这里显式给一个）
    const original = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      (element: Element) =>
        ({
          ...original(element),
          rowGap: "16px",
          paddingBlockStart: "0px",
          paddingBlockEnd: "0px",
        }) as unknown as CSSStyleDeclaration,
    );
    const spacer = document.createElement("div");
    fixture.content.appendChild(spacer);
    fixture.result.setSpacer(spacer);

    const last = addRowAtOffset(fixture.content, "m2", {
      offset: 900,
      height: 200,
      scrollTop: 0,
    });
    fixture.result.registerItem({ id: "m2", element: last });
    fixture.result.scrollToMessage("m2", { align: "start" });

    expect(spacer.style.marginTop).toBe("-16px");
    fixture.cleanup();
  });

  it("scrollToStart / scrollToEnd 会清零 spacer", async () => {
    const fixture = await mount();
    const spacer = document.createElement("div");
    fixture.content.appendChild(spacer);
    fixture.result.setSpacer(spacer);
    const last = addRowAtOffset(fixture.content, "m2", {
      offset: 900,
      height: 200,
      scrollTop: 0,
    });
    fixture.result.registerItem({ id: "m2", element: last });
    fixture.result.scrollToMessage("m2", { align: "start" });
    expect(spacer.hidden).toBe(false);

    fixture.result.scrollToStart();

    expect(spacer.hidden).toBe(true);
    expect(spacer.style.height).toBe("0px");
    expect(spacer.style.marginTop).toBe("");
    fixture.cleanup();
  });

  it("scrollToElement 目标不在内容里时返回 false", async () => {
    const fixture = await mount();
    const outsider = document.createElement("div");
    measured(outsider, { top: 0, bottom: 10 });

    expect(fixture.result.scrollToMessage("m1")).toBe(true);
    fixture.result.registerItem({ id: "ghost", element: outsider });
    // 已注册但不在 content 内 → scrollToElement 返回 false → 排队
    expect(fixture.result.scrollToMessage("ghost")).toBe(true);
    fixture.cleanup();
  });

  it("scrollToMessage：已挂载且 id 缺失返回 false", async () => {
    const fixture = await mount();

    expect(fixture.result.scrollToMessage("missing")).toBe(false);
    fixture.cleanup();
  });

  it("scrollToMessage：会话未挂载任何行时排队并立刻取消 pending 遮罩", async () => {
    const dom = setupDom();
    const hook = renderEngine({ defaultScrollPosition: "end" });
    // 空会话会让引擎把 pendingScroll 关掉，因此先断言初始值
    expect(hook.result.pendingScroll()).toBe(true);

    hook.result.setViewport(dom.viewport);
    hook.result.setContent(dom.content);
    await flushState();
    expect(hook.result.pendingScroll()).toBe(false);

    // 队列里没有行 → 排队等待客户端解析永久链接
    expect(hook.result.scrollToMessage("later")).toBe(true);
    expect(hook.result.pendingScroll()).toBe(false);
    hook.cleanup();
  });

  it("keepPreviousPeek 锚定后：resize 不会跳到底部", async () => {
    const resize = stubResizeObserver();
    const fixture = await mount({ scrollHeight: 1600 });
    const spacer = document.createElement("div");
    fixture.content.appendChild(spacer);
    fixture.result.setSpacer(spacer);
    const anchor = addRowAtOffset(fixture.content, "m3", {
      offset: 900,
      height: 200,
      scrollTop: 0,
      anchor: true,
    } as never);
    fixture.result.registerItem({ id: "m3", element: anchor });

    fixture.result.scrollToMessage("m3", { align: "start" });
    await flushState();
    const afterAnchor = fixture.viewport.scrollTop;

    resize.triggerAll();
    await flushState();

    // 原地重锚定：位置基本不变（而不是跳到 maxScrollTop）
    expect(Math.abs(fixture.viewport.scrollTop - afterAnchor)).toBeLessThan(1);
    expect(fixture.viewport.scrollTop).toBeLessThan(1600 - 400);
    fixture.cleanup();
  });
});
