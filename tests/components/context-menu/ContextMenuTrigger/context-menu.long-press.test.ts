import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLongPress } from "~/components/context-menu/ContextMenuTrigger/context-menu.long-press";

function setup(delayMs = 500, tolerancePx = 10) {
  const onTrigger = vi.fn();
  const gesture = createLongPress({ delayMs, tolerancePx, onTrigger });

  return { gesture, onTrigger };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createLongPress 计时", () => {
  it("按住到点后触发", () => {
    const { gesture, onTrigger } = setup();

    gesture.start(10, 20);
    vi.advanceTimersByTime(499);
    expect(onTrigger).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("支持自定义阈值", () => {
    const { gesture, onTrigger } = setup(100);

    gesture.start(0, 0);
    vi.advanceTimersByTime(100);

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("抬起（cancel）后不再触发", () => {
    const { gesture, onTrigger } = setup();

    gesture.start(10, 20);
    vi.advanceTimersByTime(200);
    gesture.cancel();
    vi.advanceTimersByTime(1000);

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("重复 start 会重置计时（只触发一次）", () => {
    const { gesture, onTrigger } = setup();

    gesture.start(10, 20);
    vi.advanceTimersByTime(400);
    gesture.start(10, 20);
    vi.advanceTimersByTime(400);
    expect(onTrigger).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(onTrigger).toHaveBeenCalledTimes(1);
  });
});

describe("createLongPress 抖动", () => {
  it("容差内的移动继续计时", () => {
    const { gesture, onTrigger } = setup();

    gesture.start(100, 100);
    gesture.move(105, 107);
    vi.advanceTimersByTime(500);

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("抖出容差后取消", () => {
    const { gesture, onTrigger } = setup();

    gesture.start(100, 100);
    gesture.move(120, 100);
    vi.advanceTimersByTime(500);

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("刚好等于容差不会取消", () => {
    const { gesture, onTrigger } = setup();

    gesture.start(100, 100);
    gesture.move(110, 100);
    vi.advanceTimersByTime(500);

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("取消后继续移动不会重新计时", () => {
    const { gesture, onTrigger } = setup();

    gesture.start(100, 100);
    gesture.move(200, 100);
    gesture.move(100, 100);
    vi.advanceTimersByTime(1000);

    expect(onTrigger).not.toHaveBeenCalled();
  });
});

describe("createLongPress 空操作", () => {
  it("没有 start 就 move 不报错", () => {
    const { gesture, onTrigger } = setup();

    expect(() => gesture.move(10, 10)).not.toThrow();
    vi.advanceTimersByTime(1000);
    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("没有 start 就 cancel 不报错", () => {
    const { gesture } = setup();

    expect(() => gesture.cancel()).not.toThrow();
  });

  it("触发之后再 cancel 不报错也不会重复触发", () => {
    const { gesture, onTrigger } = setup();

    gesture.start(0, 0);
    vi.advanceTimersByTime(500);
    gesture.cancel();
    vi.advanceTimersByTime(500);

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });
});
