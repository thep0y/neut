import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ToastT } from "./Toast.types";
import { useToastLifecycle } from "./useToastLifecycle";

/**
 * `requestAnimationFrame` 默认换成同步实现：jsdom 的 rAF 依赖真实帧时钟，
 * 用例无法等到"确定的某一帧"，同步化后才能断言 open 的时机（TESTING.md §4.5）。
 */
function stubSyncRaf() {
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
}

function setup(toastInit: Partial<ToastT> = {}, toasterDuration?: number) {
  const [toast, setToast] = createSignal<ToastT>({
    id: "t1",
    title: "已保存",
    ...toastInit,
  });
  const onRemove = vi.fn();

  const hook = renderHook(() =>
    useToastLifecycle({
      toast,
      duration: () => toasterDuration,
      onRemove,
    }),
  );

  return { ...hook, setToast, onRemove };
}

beforeEach(() => {
  vi.useFakeTimers();
  stubSyncRaf();
});

describe("useToastLifecycle 进出场", () => {
  it("挂载后下一帧才进入 open", () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      callbacks.push(cb);
      return 1;
    });

    const { result } = setup();
    expect(result.animationState()).toBe("closed");

    for (const callback of callbacks) callback(0);
    expect(result.animationState()).toBe("open");
  });

  it("卸载时取消未执行的 rAF", () => {
    const cancel = vi.fn();
    vi.stubGlobal("requestAnimationFrame", () => 7);
    vi.stubGlobal("cancelAnimationFrame", cancel);

    const { cleanup } = setup();
    cleanup();

    expect(cancel).toHaveBeenCalledWith(7);
  });

  it("尚未 open 时 close 是空操作（不回调、不排队移除）", () => {
    vi.stubGlobal("requestAnimationFrame", () => 1);

    const { result, onRemove } = setup({ onDismiss: vi.fn() });
    result.close();

    vi.advanceTimersByTime(1000);
    expect(result.animationState()).toBe("closed");
    expect(onRemove).not.toHaveBeenCalled();
  });

  it("close 先回调 onDismiss，动画结束后再移除", () => {
    const onDismiss = vi.fn();
    const { result, onRemove } = setup({ onDismiss });

    result.close();

    expect(result.animationState()).toBe("closed");
    expect(onDismiss).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1" }),
    );

    vi.advanceTimersByTime(199);
    expect(onRemove).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onRemove).toHaveBeenCalledWith("t1");
  });

  it("close 幂等：退场中重复调用不会重复回调", () => {
    const onDismiss = vi.fn();
    const { result, onRemove } = setup({ onDismiss });

    result.close();
    result.close();
    result.close();

    expect(onDismiss).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(200);
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});

describe("useToastLifecycle 外部 dismiss", () => {
  it("toast.delete 置位后退场并通知 onDismiss", () => {
    const onDismiss = vi.fn();
    const { result, setToast, onRemove } = setup({ onDismiss });

    expect(result.animationState()).toBe("open");

    // 模拟列表里把该条标记为待删除
    setToast((prev) => ({ ...prev, delete: true }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(result.animationState()).toBe("closed");

    vi.advanceTimersByTime(200);
    expect(onRemove).toHaveBeenCalledWith("t1");
  });

  it("挂载时已是 delete 状态也会退场", () => {
    const onDismiss = vi.fn();
    const { result } = setup({ delete: true, onDismiss });

    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(result.animationState()).toBe("closed");
  });
});

describe("useToastLifecycle 自动关闭", () => {
  it("默认 4000ms 后触发，且先回调 onAutoClose 再退场", () => {
    const onAutoClose = vi.fn();
    const { result, onRemove } = setup({ onAutoClose });

    vi.advanceTimersByTime(3999);
    expect(onAutoClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onAutoClose).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1" }),
    );
    expect(result.animationState()).toBe("closed");

    vi.advanceTimersByTime(200);
    expect(onRemove).toHaveBeenCalledWith("t1");
  });

  it("toast 级 duration 优先于 Toaster 级 duration", () => {
    const { result } = setup({ duration: 1000 }, 5000);

    vi.advanceTimersByTime(1000);
    expect(result.animationState()).toBe("closed");
  });

  it("没有 toast 级 duration 时使用 Toaster 级 duration", () => {
    const { result } = setup({}, 1000);

    vi.advanceTimersByTime(999);
    expect(result.animationState()).toBe("open");
    vi.advanceTimersByTime(1);
    expect(result.animationState()).toBe("closed");
  });

  it.each([
    ["duration 为 Infinity", { duration: Infinity }],
    ["duration 为 0", { duration: 0 }],
    ["loading 类型", { type: "loading" as const }],
  ])("%s 时不安排自动关闭", (_name, toastInit) => {
    const onAutoClose = vi.fn();
    const { result } = setup({ ...toastInit, onAutoClose });

    vi.advanceTimersByTime(10_000);

    expect(onAutoClose).not.toHaveBeenCalled();
    expect(result.animationState()).toBe("open");
  });

  it("卸载时清理自动关闭计时器", () => {
    const onAutoClose = vi.fn();
    const { cleanup, onRemove } = setup({ onAutoClose }, 1000);

    cleanup();
    vi.advanceTimersByTime(10_000);

    expect(onAutoClose).not.toHaveBeenCalled();
    expect(onRemove).not.toHaveBeenCalled();
  });
});
