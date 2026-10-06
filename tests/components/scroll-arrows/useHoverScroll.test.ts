import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HOVER_BAND_PX,
  HOVER_SCROLL_DELAY,
  useHoverScroll,
} from "~/components/scroll-arrows/useHoverScroll";
import { stubRect } from "~tests/components/message-scroller/test-utils";

/**
 * 悬停滚动的单测。
 *
 * jsdom 不做布局：视口矩形与滚动范围都显式 stub，用一个可控的"滚轮坐标系"驱动
 * （TESTING.md §4.5）。假定时器下 `requestAnimationFrame` 是 16ms 一帧，
 * 因此用 `flushFrames` 推进。
 */

/** 造一个可滚动的容器：400 高、内容 1000，scrollTop 按真实滚动条语义夹取 */
function scrollable(
  options: { scrollHeight?: number; clientHeight?: number } = {},
) {
  const element = document.createElement("div");
  const clientHeight = options.clientHeight ?? 400;
  const scrollHeight = options.scrollHeight ?? 1000;
  Object.defineProperty(element, "clientHeight", {
    configurable: true,
    value: clientHeight,
  });
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    value: scrollHeight,
  });
  let scrollTop = 0;
  Object.defineProperty(element, "scrollTop", {
    configurable: true,
    get: () => scrollTop,
    set: (value: number) => {
      scrollTop = Math.max(0, Math.min(value, scrollHeight - clientHeight));
    },
  });
  stubRect(element, { top: 0, bottom: clientHeight, height: clientHeight });
  document.body.appendChild(element);
  return element;
}

function setup(
  options: {
    element?: HTMLElement;
    enabled?: boolean;
    canScrollUp?: boolean;
    canScrollDown?: boolean;
  } = {},
) {
  const element = options.element ?? scrollable();
  const [target, setTarget] = createSignal<HTMLElement | undefined>(element);
  const [enabled, setEnabled] = createSignal(options.enabled ?? true);
  const [canScrollUp, setCanScrollUp] = createSignal(
    options.canScrollUp ?? true,
  );
  const [canScrollDown, setCanScrollDown] = createSignal(
    options.canScrollDown ?? true,
  );

  const hook = renderHook(() =>
    useHoverScroll({ target, canScrollUp, canScrollDown, enabled }),
  );

  const move = (clientY: number) =>
    element.dispatchEvent(
      new PointerEvent("pointermove", { clientY, bubbles: true }),
    );
  const down = () =>
    element.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));

  return {
    ...hook,
    element,
    move,
    down,
    setTarget,
    setEnabled,
    setCanScrollUp,
    setCanScrollDown,
  };
}

/** 推进若干帧（每帧 16ms） */
async function flushFrames(times = 1) {
  for (let index = 0; index < times; index += 1) {
    await vi.advanceTimersByTimeAsync(16);
  }
}

beforeEach(() => {
  document.body.innerHTML = "";
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("useHoverScroll - 边缘带判定", () => {
  it("停在底部带内并等待后开始向下滚", async () => {
    const { element, move } = setup({ canScrollUp: false });
    move(390); // 距底部 10px

    await vi.advanceTimersByTimeAsync(HOVER_SCROLL_DELAY);
    // 400 / 24 ≈ 16.67 → 每帧 16.67px
    await flushFrames(1);

    expect(element.scrollTop).toBeCloseTo(400 / 24);
  });

  it("停在顶部带内并等待后开始向上滚", async () => {
    const element = scrollable();
    element.scrollTop = 100;
    const { move } = setup({ element, canScrollDown: false });

    move(10); // 距顶部 10px
    await vi.advanceTimersByTimeAsync(HOVER_SCROLL_DELAY);
    await flushFrames(1);

    expect(element.scrollTop).toBeCloseTo(100 - 400 / 24);
  });

  it("指针在中间区域时不滚动（并停掉已开始的滚动）", async () => {
    const { element, move } = setup();
    move(390);
    await vi.advanceTimersByTimeAsync(HOVER_SCROLL_DELAY);
    await flushFrames(2);
    const scrolled = element.scrollTop;
    expect(scrolled).toBeGreaterThan(0);

    move(200);
    await flushFrames(3);

    expect(element.scrollTop).toBeCloseTo(scrolled);
  });

  it("带边界：距边缘正好 24px 算带内，25px 不算", async () => {
    // 容器 400 高：clientY 376 距底部 24px，375 距底部 25px
    const inside = setup({ canScrollUp: false });
    inside.move(400 - HOVER_BAND_PX);
    await vi.advanceTimersByTimeAsync(HOVER_SCROLL_DELAY);
    await flushFrames(1);
    expect(inside.element.scrollTop).toBeGreaterThan(0);

    const outside = setup({ canScrollUp: false });
    outside.move(400 - HOVER_BAND_PX - 1);
    await vi.advanceTimersByTimeAsync(HOVER_SCROLL_DELAY);
    await flushFrames(2);
    expect(outside.element.scrollTop).toBe(0);

    expect(HOVER_BAND_PX).toBe(24);
  });

  it("该方向没有内容时不滚动（与箭头显隐同源）", async () => {
    const bottom = setup({ canScrollDown: false });
    bottom.move(390);
    await vi.advanceTimersByTimeAsync(HOVER_SCROLL_DELAY);
    await flushFrames(2);
    expect(bottom.element.scrollTop).toBe(0);

    const top = setup({ canScrollUp: false });
    top.move(10);
    await vi.advanceTimersByTimeAsync(HOVER_SCROLL_DELAY);
    await flushFrames(2);
    expect(top.element.scrollTop).toBe(0);
  });

  it("带内移动会重置停留计时（掠过不触发）", async () => {
    const { element, move } = setup({ canScrollUp: false });
    move(390);
    await vi.advanceTimersByTimeAsync(100);
    move(392);
    await vi.advanceTimersByTimeAsync(100);

    // 距第二次移动只过了 100ms，还没到 150ms
    expect(element.scrollTop).toBe(0);

    await vi.advanceTimersByTimeAsync(60);
    await flushFrames(1);
    expect(element.scrollTop).toBeGreaterThan(0);
  });
});

describe("useHoverScroll - 停止条件", () => {
  it("停留计时未到期就离开边缘带：计时被取消，不会突然开始滚", async () => {
    const { element, move } = setup({ canScrollUp: false });
    move(390);
    await vi.advanceTimersByTimeAsync(100);

    move(200); // 中途离开带内
    await vi.advanceTimersByTimeAsync(200);
    await flushFrames(2);

    expect(element.scrollTop).toBe(0);
  });

  it("停留计时未到期就按下指针：计时同样被取消", async () => {
    const { element, move, down } = setup({ canScrollUp: false });
    move(390);
    await vi.advanceTimersByTimeAsync(100);

    down();
    await vi.advanceTimersByTimeAsync(200);
    await flushFrames(2);

    expect(element.scrollTop).toBe(0);
  });

  it("滚到边界后自动停（scrollTop 不再变化）", async () => {
    const { element, move } = setup({ canScrollUp: false });
    move(390);
    await vi.advanceTimersByTimeAsync(HOVER_SCROLL_DELAY);

    await flushFrames(40);

    expect(element.scrollTop).toBe(600); // 1000 - 400
    const settled = element.scrollTop;
    await flushFrames(5);
    expect(element.scrollTop).toBe(settled);
  });

  it("滚动进行中在同一带内继续移动指针不会重排计时（保持连续滚动）", async () => {
    const { element, move } = setup({ canScrollUp: false });
    move(390);
    await vi.advanceTimersByTimeAsync(HOVER_SCROLL_DELAY);
    await flushFrames(2);
    const scrolled = element.scrollTop;

    // 已在向下滚：再次进入同一带不应重新等待 150ms
    move(392);
    await flushFrames(1);

    expect(element.scrollTop).toBeGreaterThan(scrolled);
  });

  it("pointerdown 立即停止（否则按下时选项还在移动）", async () => {
    const { element, move, down } = setup({ canScrollUp: false });
    move(390);
    await vi.advanceTimersByTimeAsync(HOVER_SCROLL_DELAY);
    await flushFrames(2);
    const scrolled = element.scrollTop;

    down();
    await flushFrames(3);

    expect(element.scrollTop).toBeCloseTo(scrolled);
  });

  it("滚轮 / 键盘 / 触摸 / 指针离开都会停止", async () => {
    for (const eventName of [
      "wheel",
      "keydown",
      "touchstart",
      "pointerleave",
    ]) {
      const { element, move } = setup({ canScrollUp: false });
      move(390);
      await vi.advanceTimersByTimeAsync(HOVER_SCROLL_DELAY);
      await flushFrames(2);
      const scrolled = element.scrollTop;

      element.dispatchEvent(new Event(eventName, { bubbles: true }));
      await flushFrames(3);

      expect(element.scrollTop, `${eventName} 应停止滚动`).toBeCloseTo(
        scrolled,
      );
    }
  });

  it("已排队的帧在停止之后才到达时不会继续滚（方向已清空）", async () => {
    // 模拟"取消来不及生效"：浏览器已经取走回调时 cancel 是无效的
    const queued: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      queued.push(callback);
      return queued.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    const { element, move } = setup({ canScrollUp: false });

    move(390);
    await vi.advanceTimersByTimeAsync(HOVER_SCROLL_DELAY);
    expect(queued.length).toBe(1);

    move(200); // 离开带内 → 停止（此时取消无效）
    for (const callback of [...queued]) callback(0);

    expect(element.scrollTop).toBe(0);
  });

  it("禁用时完全不响应", async () => {
    const { element, move } = setup({ canScrollUp: false, enabled: false });
    move(390);
    await vi.advanceTimersByTimeAsync(HOVER_SCROLL_DELAY);
    await flushFrames(3);

    expect(element.scrollTop).toBe(0);
  });

  it("运行中被禁用会停掉滚动", async () => {
    const { element, move, setEnabled } = setup({ canScrollUp: false });
    move(390);
    await vi.advanceTimersByTimeAsync(HOVER_SCROLL_DELAY);
    await flushFrames(2);
    const scrolled = element.scrollTop;

    setEnabled(false);
    await flushFrames(3);

    expect(element.scrollTop).toBeCloseTo(scrolled);
  });
});

describe("useHoverScroll - 生命周期", () => {
  it("没有容器时是空操作", async () => {
    const { setTarget } = setup();
    setTarget(undefined);

    await expect(flushFrames(2)).resolves.toBeUndefined();
  });

  it("卸载时移除监听并停止滚动", async () => {
    const { element, move, cleanup } = setup({ canScrollUp: false });
    move(390);
    await vi.advanceTimersByTimeAsync(HOVER_SCROLL_DELAY);
    await flushFrames(1);
    const scrolled = element.scrollTop;
    expect(scrolled).toBeGreaterThan(0);

    cleanup();
    move(390);
    await flushFrames(3);

    expect(element.scrollTop).toBeCloseTo(scrolled);
  });

  it("更换容器后监听新容器、旧容器不再响应", async () => {
    const first = scrollable();
    const second = scrollable();
    const { move, setTarget } = setup({ element: first, canScrollUp: false });

    setTarget(second);
    move(390);
    await vi.advanceTimersByTimeAsync(HOVER_SCROLL_DELAY);
    await flushFrames(2);

    expect(first.scrollTop).toBe(0);
    expect(second.scrollTop).toBe(0);

    second.dispatchEvent(
      new PointerEvent("pointermove", { clientY: 390, bubbles: true }),
    );
    await vi.advanceTimersByTimeAsync(HOVER_SCROLL_DELAY);
    await flushFrames(1);

    expect(second.scrollTop).toBeGreaterThan(0);
  });

  it("内容放得下（clientHeight 为 0）时不会死循环", async () => {
    const element = scrollable({ scrollHeight: 0, clientHeight: 0 });
    const { move } = setup({ element });
    move(0);
    await vi.advanceTimersByTimeAsync(HOVER_SCROLL_DELAY);
    await flushFrames(3);

    expect(element.scrollTop).toBe(0);
  });
});
