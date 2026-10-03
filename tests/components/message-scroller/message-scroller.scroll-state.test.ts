import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createScrollState } from "~/components/message-scroller/message-scroller.scroll-state";
import {
  ENGINE_DEFAULTS,
  flushFrames,
  stubRect,
} from "~tests/components/message-scroller/test-utils";

/**
 * 滚动状态机的单测。
 *
 * 引擎级用例（`…scrolling.test.ts`）覆盖了"跟随/让位"的行为，这里补上
 * 模块自身每条迁移与计时器分支，保证拆出来的状态机可以独立 100% 覆盖。
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

/** 视口 400 高、可滚 600；内容底部由用例显式给出 */
function setup(
  initial: {
    autoScroll?: boolean;
    scrollEdgeThreshold?: number;
    contentBottom?: number;
    scrollTop?: number;
    scrollHeight?: number;
    clientHeight?: number;
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
    value: initial.scrollHeight ?? 1000,
  });
  Object.defineProperty(viewport, "clientHeight", {
    configurable: true,
    value: initial.clientHeight ?? 400,
  });
  Object.defineProperty(viewport, "scrollTop", {
    configurable: true,
    writable: true,
    value: initial.scrollTop ?? 0,
  });
  document.body.appendChild(viewport);

  const [viewportAccessor, setViewport] = createSignal<HTMLElement | undefined>(
    viewport,
  );
  const [contentBottom, setContentBottom] = createSignal(
    initial.contentBottom ?? 900,
  );
  const options = {
    ...ENGINE_DEFAULTS,
    autoScroll: initial.autoScroll ?? false,
    scrollEdgeThreshold: initial.scrollEdgeThreshold ?? 8,
  };

  const hook = renderHook(() =>
    createScrollState({
      viewport: viewportAccessor,
      contentBottom,
      options: () => options,
    }),
  );

  return { ...hook, viewport, setViewport, setContentBottom };
}

/** 让视口滚到某个位置 */
function scrollViewportTo(fixture: { viewport: HTMLElement }, top: number) {
  fixture.viewport.scrollTop = top;
}

describe("createScrollState 初始模式", () => {
  it("autoScroll 关闭时不在跟随", () => {
    const { result } = setup({ autoScroll: false });

    expect(result.isFollowing()).toBe(false);
    expect(result.isAnchored()).toBe(false);
  });

  it("autoScroll 开启时初始即跟随", () => {
    const { result } = setup({ autoScroll: true });

    expect(result.isFollowing()).toBe(true);
  });
});

describe("createScrollState 语义化迁移", () => {
  it("setFollowing / setFree / anchorTo / settleJump 各自设定模式", () => {
    const { result } = setup();

    result.setFollowing();
    expect(result.isFollowing()).toBe(true);

    result.anchorTo();
    expect(result.isAnchored()).toBe(true);
    expect(result.isFollowing()).toBe(false);

    result.settleJump();
    expect(result.isAnchored()).toBe(false);
    expect(result.isFollowing()).toBe(false);

    result.setFree();
    expect(result.isFollowing()).toBe(false);
    expect(result.isAnchored()).toBe(false);
  });
});

describe("createScrollState commit 与模式迁移", () => {
  it("没有 viewport 时两侧都不可滚", () => {
    const { result, setViewport } = setup();
    setViewport(undefined);

    result.commit();

    expect(result.scrollableStart()).toBe(false);
    expect(result.scrollableEnd()).toBe(false);
  });

  it("在阈值内不算可滚，越过阈值才算", () => {
    const { result, viewport, setContentBottom } = setup({
      contentBottom: 808,
    });
    scrollViewportTo({ viewport }, 400);
    result.commit();
    // 808 - 400 - 400 = 8，恰好等于阈值 8 → 不算
    expect(result.scrollableEnd()).toBe(false);

    setContentBottom(809);
    result.commit();
    expect(result.scrollableEnd()).toBe(true);
  });

  it("向上滚出阈值后暴露可向上滚", () => {
    const { result, viewport } = setup({ contentBottom: 900 });
    scrollViewportTo({ viewport }, 0);
    result.commit();
    expect(result.scrollableStart()).toBe(false);

    scrollViewportTo({ viewport }, 20);
    result.commit();
    expect(result.scrollableStart()).toBe(true);
  });

  it("autoScroll 且回到实时边缘时重新跟随", () => {
    const { result, viewport } = setup({
      autoScroll: true,
      contentBottom: 1000,
    });
    result.setFree();
    // 内容底部 1000 - 600 - 400 = 0 → 已在实时边缘（end 为 false）
    scrollViewportTo({ viewport }, 600);

    result.commit();

    expect(result.isFollowing()).toBe(true);
  });

  it("跳转过渡态与锚定态不会被 autoScroll 抢回跟随", () => {
    const { result, viewport } = setup({
      autoScroll: true,
      contentBottom: 1600,
    });
    scrollViewportTo({ viewport }, 100);

    result.settleJump();
    result.commit();
    expect(result.isFollowing()).toBe(false);

    result.anchorTo();
    result.commit();
    expect(result.isFollowing()).toBe(false);
    expect(result.isAnchored()).toBe(true);
  });

  it("跟随时上移离开底部会交出控制权", () => {
    const { result, viewport } = setup({
      autoScroll: true,
      contentBottom: 1600,
    });
    scrollViewportTo({ viewport }, 1200);
    result.setFollowing();
    result.commit();

    scrollViewportTo({ viewport }, 600);
    result.commit();

    expect(result.isFollowing()).toBe(false);
  });

  it("正在自动滚动时上移不会交出控制权", () => {
    const { result, viewport } = setup({
      autoScroll: true,
      contentBottom: 1600,
    });
    scrollViewportTo({ viewport }, 1200);
    result.setFollowing();
    result.beginAutoScroll();

    scrollViewportTo({ viewport }, 600);
    result.commit();

    expect(result.isFollowing()).toBe(true);
  });

  it("跟随时对 UI 隐藏「还能向下滚」", () => {
    const { result, viewport } = setup({
      autoScroll: true,
      contentBottom: 1600,
    });
    scrollViewportTo({ viewport }, 0);

    result.setFollowing();
    result.commit();

    // 内容底部 1600 - 0 - 400 = 1200 > 8，但跟随态对外隐藏
    expect(result.scrollableEnd()).toBe(false);
  });
});

describe("createScrollState 自动滚动计时器", () => {
  it("开启后到期自动复位", async () => {
    const { result } = setup();

    result.beginAutoScroll();
    expect(result.autoscrolling()).toBe(true);

    await vi.advanceTimersByTimeAsync(180);
    expect(result.autoscrolling()).toBe(false);
  });

  it("重复开启会重置计时器", async () => {
    const { result } = setup();

    result.beginAutoScroll();
    await vi.advanceTimersByTimeAsync(100);
    result.beginAutoScroll();
    await vi.advanceTimersByTimeAsync(100);

    // 距第二次开启只过了 100ms
    expect(result.autoscrolling()).toBe(true);

    await vi.advanceTimersByTimeAsync(100);
    expect(result.autoscrolling()).toBe(false);
  });

  it("关闭时清掉计时器，之后不会再改状态", async () => {
    const { result } = setup();
    result.beginAutoScroll();

    result.endAutoScroll();

    expect(result.autoscrolling()).toBe(false);
    await vi.advanceTimersByTimeAsync(300);
    expect(result.autoscrolling()).toBe(false);
  });

  it("已经是关闭态时再关闭不会重复提交", () => {
    const { result } = setup();
    result.commit();

    result.endAutoScroll();

    expect(result.autoscrolling()).toBe(false);
  });
});

describe("createScrollState releaseFollow", () => {
  it.each(["following", "anchored", "settling"] as const)(
    "%s 态让位后转为自由滚动并关掉自动滚动",
    (from) => {
      const { result } = setup();
      if (from === "following") result.setFollowing();
      if (from === "anchored") result.anchorTo();
      if (from === "settling") result.settleJump();
      result.beginAutoScroll();

      result.releaseFollow();

      expect(result.isFollowing()).toBe(false);
      expect(result.isAnchored()).toBe(false);
      expect(result.autoscrolling()).toBe(false);
    },
  );

  it("已经是自由滚动时是空操作", () => {
    const { result } = setup();
    result.setFree();

    result.releaseFollow();

    expect(result.isFollowing()).toBe(false);
  });
});

describe("createScrollState schedule 与 dispose", () => {
  it("一帧内多次 schedule 只提交一次", async () => {
    const { result, viewport } = setup({ contentBottom: 1600 });
    const raf = vi.spyOn(window, "requestAnimationFrame");

    result.schedule();
    result.schedule();
    result.schedule();

    expect(raf.mock.calls.length).toBe(1);

    scrollViewportTo({ viewport }, 0);
    await flushFrames(1);

    // 帧回调里提交：内容底部 1600 > 视口 → 还能向下滚
    expect(result.scrollableEnd()).toBe(true);
  });

  it("dispose 取消未执行的帧与计时器", async () => {
    const { result } = setup();

    result.beginAutoScroll();
    result.schedule();
    result.dispose();

    await vi.advanceTimersByTimeAsync(300);

    // 到期回调已被取消：状态保持 dispose 前的值（仍为 true）
    expect(result.autoscrolling()).toBe(true);
  });

  it("没有待处理帧与计时器时 dispose 是空操作", () => {
    const { result } = setup();

    expect(() => result.dispose()).not.toThrow();
  });
});
