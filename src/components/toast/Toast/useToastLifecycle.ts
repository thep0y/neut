import {
  type Accessor,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import type { ToastT } from "./Toast.types";

/** 未指定 duration 时的存活时间 */
export const TOAST_LIFETIME = 4000;
/** 退场动画时长：状态先变 closed，动画结束后才通知父级移除 */
export const EXIT_ANIMATION_MS = 200;

export interface UseToastLifecycleOptions {
  /** 当前 toast 数据（响应式读取，外部可随时改写 delete/duration） */
  toast: Accessor<ToastT>;
  /** Toaster 级别的兜底 duration */
  duration: Accessor<number | undefined>;
  /** 退场动画结束后的真正移除 */
  onRemove: (id: string) => void;
}

export interface ToastLifecycle {
  /** open 表示已进入；closed 表示正在退场（或尚未进入） */
  animationState: Accessor<"open" | "closed">;
  close: () => void;
}

/**
 * Toast 的进出场生命周期：只关心"什么时候 open、什么时候 closed、什么时候移除"，
 * 不关心长什么样。渲染层订阅 `animationState` 决定 data-state 与动画。
 *
 * - 挂载后延后一帧再置 open：让浏览器先以 closed 状态完成首次绘制，动画才有起点；
 * - `close()` 幂等：退场中的重复调用不会重复回调与重复排队移除；
 * - 外部 dismiss（`toast.delete`）复用了同一条退场路径，避免两套退出逻辑；
 * - loading 类型、`duration` 为 `0`/`Infinity` 时视为常驻，不安排自动关闭。
 */
export function useToastLifecycle(
  options: UseToastLifecycleOptions,
): ToastLifecycle {
  const [animationState, setAnimationState] = createSignal<"open" | "closed">(
    "closed",
  );

  onMount(() => {
    const raf = requestAnimationFrame(() => setAnimationState("open"));
    onCleanup(() => cancelAnimationFrame(raf));
  });

  const close = () => {
    if (animationState() !== "open") return;

    setAnimationState("closed");
    options.toast().onDismiss?.(options.toast());
    setTimeout(() => options.onRemove(options.toast().id), EXIT_ANIMATION_MS);
  };

  // 外部 dismiss：把 delete 标记转换成退场动画
  createEffect(() => {
    if (options.toast().delete && animationState() === "open") {
      close();
    }
  });

  // 自动关闭计时器
  createEffect(() => {
    const current = options.toast();
    if (
      current.delete ||
      current.type === "loading" ||
      current.duration === Infinity ||
      current.duration === 0
    ) {
      return;
    }

    const delay = current.duration ?? options.duration() ?? TOAST_LIFETIME;
    const timer = setTimeout(() => {
      current.onAutoClose?.(current);
      close();
    }, delay);

    onCleanup(() => clearTimeout(timer));
  });

  return { animationState, close };
}
