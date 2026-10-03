import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addRowAtOffset,
  flushFrames,
  renderEngine,
  setupDom,
  stubIntersectionObserver,
  stubRect,
} from "~tests/components/message-scroller/test-utils";

/**
 * 引擎的「可见性与阅读锚点」行为。
 *
 * 按 REFACTOR-PLAN.md §4 e 编写：Step 2 会把这块搬进
 * `message-scroller.visibility.ts`，届时这些用例必须保持全绿。
 *
 * 要点：有 IO 时「可见」由回调投递的 id 集合决定；没有 IO 时退化为按矩形逐项判定；
 * 而 `currentAnchorId`（阅读行）在任何情况下都按矩形算。
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
 * 三行内容：m1(0-300)、m2(300-600, 锚点)、m3(600-900, 锚点)。
 * 容器 400 高、锚点阅读线 = scrollMargin(0) + peek(64)。
 */
function buildFixture(options: { scrollTop?: number } = {}) {
  const scrollTop = options.scrollTop ?? 0;
  const dom = setupDom({ scrollTop, scrollHeight: 1600, clientHeight: 400 });
  const m1 = addRowAtOffset(dom.content, "m1", {
    offset: 0,
    height: 300,
    scrollTop,
  });
  const m2 = addRowAtOffset(
    dom.content,
    "m2",
    { offset: 300, height: 300, scrollTop },
    true,
  );
  const m3 = addRowAtOffset(
    dom.content,
    "m3",
    { offset: 600, height: 300, scrollTop },
    true,
  );
  return { ...dom, m1, m2, m3 };
}

async function mountVisibility(options: {
  scrollTop?: number;
  subscribe?: boolean;
}) {
  const rows = buildFixture({ scrollTop: options.scrollTop });
  const hook = renderEngine({ defaultScrollPosition: "start" });
  hook.result.setViewport(rows.viewport);
  hook.result.setContent(rows.content);
  hook.result.registerItem({ id: "m1", element: rows.m1 });
  hook.result.registerItem({ id: "m2", element: rows.m2 });
  hook.result.registerItem({ id: "m3", element: rows.m3 });
  await flushFrames();

  const release =
    options.subscribe === false ? undefined : hook.result.subscribeVisibility();
  await flushFrames();

  return { ...hook, ...rows, release };
}

describe("useMessageScrollerEngine - 可见性（无 IntersectionObserver）", () => {
  it("退化为按矩形逐项判定", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const fixture = await mountVisibility({});

    // 阅读线 = 64；m3 的 top 600 已越过视口底部 400
    expect(fixture.result.visibleMessageIds()).toEqual(["m1", "m2"]);
    fixture.cleanup();
  });

  it("阅读锚点取阅读线之上最后一个锚点", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const fixture = await mountVisibility({});

    // m2(top 300)、m3(top 600) 都是锚点，但只有 m2 在阅读线(64)之上？
    // 300 > 64+0.5 → 不算；m1 不是锚点 → 没有锚点被越过
    expect(fixture.result.currentAnchorId()).toBeNull();
    fixture.cleanup();
  });

  it("滚动后阅读锚点落在越过的最后一个锚点上", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    const fixture = await mountVisibility({ scrollTop: 400 });
    const scrolled = 400;
    for (const [id, offset] of [
      ["m1", 0],
      ["m2", 300],
      ["m3", 600],
    ] as const) {
      const row = fixture.content.querySelector<HTMLElement>(
        `[data-message-id="${id}"]`,
      );
      if (row) {
        // 行在视口中的 top = offset - scrollTop；阅读线 = 0 + 64
        stubRect(row, {
          top: offset - scrolled,
          bottom: offset - scrolled + 300,
          height: 300,
        });
      }
    }
    fixture.viewport.dispatchEvent(new Event("scroll"));
    await flushFrames();

    // m2 的视口 top = -100 ≤ 64.5，m3 的 top = 200 > 64.5 → 阅读行是 m2
    expect(fixture.result.currentAnchorId()).toBe("m2");
    fixture.cleanup();
  });

  it("全部不可见且没有锚点越过阅读线时两个信号都清空", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    // 全部改成非锚点行，并滚到所有行都越出阅读线（bottom ≤ 64）
    const rows = buildFixture({ scrollTop: 1000 });
    for (const row of [rows.m2, rows.m3]) {
      row.setAttribute("data-scroll-anchor", "false");
    }
    const hook = renderEngine({ defaultScrollPosition: "start" });
    hook.result.setViewport(rows.viewport);
    hook.result.setContent(rows.content);
    hook.result.registerItem({ id: "m1", element: rows.m1 });
    hook.result.registerItem({ id: "m2", element: rows.m2 });
    hook.result.registerItem({ id: "m3", element: rows.m3 });
    await flushFrames();
    hook.result.subscribeVisibility();
    await flushFrames();

    expect(hook.result.visibleMessageIds()).toEqual([]);
    expect(hook.result.currentAnchorId()).toBeNull();
    hook.cleanup();
  });

  it("没有 viewport / content 时清空", async () => {
    const { result, cleanup } = renderEngine();
    const release = result.subscribeVisibility();
    await flushFrames();

    expect(result.visibleMessageIds()).toEqual([]);
    expect(result.currentAnchorId()).toBeNull();

    release();
    cleanup();
  });
});

describe("useMessageScrollerEngine - 可见性（有 IntersectionObserver）", () => {
  it("首个订阅者建立观察器，root 与 rootMargin 用视口与阅读留白", async () => {
    const observer = stubIntersectionObserver();
    const fixture = await mountVisibility({});

    const instance = observer.last();
    expect(instance).toBeDefined();
    expect(instance?.options?.root).toBe(fixture.viewport);
    expect(String(instance?.options?.rootMargin)).toBe("-64px 0px 0px 0px");
    // 已注册的三行都被 observe
    expect(instance?.observed.size).toBe(3);
    fixture.cleanup();
  });

  it("可见集合来自回调投递的 id（不是矩形）", async () => {
    const observer = stubIntersectionObserver();
    const fixture = await mountVisibility({});

    observer.last()?.trigger([{ target: fixture.m3, isIntersecting: true }]);
    await flushFrames();

    expect(fixture.result.visibleMessageIds()).toEqual(["m3"]);
    fixture.cleanup();
  });

  it("离开视口的回调会把 id 移出集合", async () => {
    const observer = stubIntersectionObserver();
    const fixture = await mountVisibility({});
    observer.last()?.trigger([{ target: fixture.m1, isIntersecting: true }]);
    await flushFrames();
    expect(fixture.result.visibleMessageIds()).toEqual(["m1"]);

    observer.last()?.trigger([{ target: fixture.m1, isIntersecting: false }]);
    await flushFrames();

    expect(fixture.result.visibleMessageIds()).toEqual([]);
    fixture.cleanup();
  });

  it("没有 messageId 的条目被忽略", async () => {
    const observer = stubIntersectionObserver();
    const fixture = await mountVisibility({});
    const stray = document.createElement("div");
    fixture.content.appendChild(stray);

    observer.last()?.trigger([{ target: stray, isIntersecting: true }]);
    await flushFrames();

    expect(fixture.result.visibleMessageIds()).toEqual([]);
    fixture.cleanup();
  });

  it("锚点仍按矩形判定阅读行（不依赖 IO 回调）", async () => {
    const observer = stubIntersectionObserver();
    const fixture = await mountVisibility({});
    // m2 在阅读线之内：在视口中的 top = 300 - 0 = 300 > 64.5 → 还不算
    expect(fixture.result.currentAnchorId()).toBeNull();

    // 把它挪到阅读线之上
    stubRect(fixture.m2, { top: -100, bottom: 200, height: 300 });
    observer.last()?.trigger([{ target: fixture.m2, isIntersecting: true }]);
    await flushFrames();

    expect(fixture.result.currentAnchorId()).toBe("m2");
    fixture.cleanup();
  });

  it("订阅计数：两个订阅者共用一个观察器，最后一个撤销时断开", async () => {
    const observer = stubIntersectionObserver();
    const fixture = await mountVisibility({});
    const instancesAfterFirst = observer.instances.length;

    const second = fixture.result.subscribeVisibility();
    await flushFrames();
    expect(observer.instances.length).toBe(instancesAfterFirst);

    fixture.release?.();
    second();
    await flushFrames();

    expect(observer.last()?.observed.size).toBe(0);
    fixture.cleanup();
  });

  it("重新订阅会重建观察器", async () => {
    const observer = stubIntersectionObserver();
    const fixture = await mountVisibility({});
    const first = observer.instances.length;

    fixture.release?.();
    await flushFrames();
    const releaseAgain = fixture.result.subscribeVisibility();
    await flushFrames();

    expect(observer.instances.length).toBe(first + 1);
    releaseAgain();
    fixture.cleanup();
  });

  it("撤销订阅时取消尚未执行的可见性帧", async () => {
    const observer = stubIntersectionObserver();
    const rows = buildFixture({});
    const hook = renderEngine({ defaultScrollPosition: "start" });
    hook.result.setViewport(rows.viewport);
    hook.result.setContent(rows.content);
    hook.result.registerItem({ id: "m1", element: rows.m1 });
    await flushFrames();

    // 订阅会排一帧，立刻撤销 → 走到"取消未执行帧"的分支
    const release = hook.result.subscribeVisibility();
    release();

    expect(observer.last()?.observed.size).toBe(0);
    await flushFrames();
    hook.cleanup();
  });

  it("重复调用同一个释放函数是安全的", async () => {
    const observer = stubIntersectionObserver();
    const fixture = await mountVisibility({});

    expect(() => {
      fixture.release?.();
      fixture.release?.();
    }).not.toThrow();

    expect(observer.instances.length).toBeGreaterThan(0);
    fixture.cleanup();
  });
});

describe("useMessageScrollerEngine - 行的注册与注销", () => {
  it("订阅后再注册的行会被 observe", async () => {
    const observer = stubIntersectionObserver();
    const fixture = await mountVisibility({});
    const before = observer.last()?.observed.size ?? 0;

    const extra = addRowAtOffset(fixture.content, "m4", {
      offset: 900,
      height: 200,
      scrollTop: 0,
    });
    fixture.result.registerItem({ id: "m4", element: extra });
    await flushFrames();

    expect(observer.last()?.observed.size).toBe(before + 1);
    fixture.cleanup();
  });

  it("注销后停止观察并从可见集合里移除", async () => {
    const observer = stubIntersectionObserver();
    const rows = buildFixture({});
    const hook = renderEngine({ defaultScrollPosition: "start" });
    hook.result.setViewport(rows.viewport);
    hook.result.setContent(rows.content);
    const unregister = hook.result.registerItem({
      id: "m1",
      element: rows.m1,
    });
    hook.result.registerItem({ id: "m2", element: rows.m2 });
    await flushFrames();
    hook.result.subscribeVisibility();
    await flushFrames();
    observer.last()?.trigger([{ target: rows.m1, isIntersecting: true }]);
    await flushFrames();
    expect(hook.result.visibleMessageIds()).toEqual(["m1"]);

    unregister();
    await flushFrames();

    expect(observer.last()?.observed.has(rows.m1)).toBe(false);
    expect(hook.result.visibleMessageIds()).toEqual([]);
    hook.cleanup();
  });

  it("重复注册同一元素不会丢掉观察状态", async () => {
    const observer = stubIntersectionObserver();
    const rows = buildFixture({});
    const hook = renderEngine({ defaultScrollPosition: "start" });
    hook.result.setViewport(rows.viewport);
    hook.result.setContent(rows.content);
    hook.result.registerItem({ id: "m1", element: rows.m1 });
    await flushFrames();
    hook.result.subscribeVisibility();
    await flushFrames();

    // 再注册一次同一元素：注册表里仍是它，观察状态不受影响
    hook.result.registerItem({ id: "m1", element: rows.m1 });
    await flushFrames();

    expect(observer.last()?.observed.has(rows.m1)).toBe(true);
    hook.cleanup();
  });

  it("卸载引擎时断开观察器", async () => {
    const observer = stubIntersectionObserver();
    const fixture = await mountVisibility({});
    observer.last()?.trigger([{ target: fixture.m1, isIntersecting: true }]);
    await flushFrames();
    expect(observer.last()?.observed.size).toBe(3);

    fixture.cleanup();

    // 卸载清理走的是"直接 disconnect"这条路径（不清 visibleIds / 信号：
    // 订阅计数与可见性状态归组件生命周期，卸载后没有消费方）
    expect(observer.last()?.observed.size).toBe(0);
    expect(fixture.result.currentAnchorId()).toBeNull();
  });
});
