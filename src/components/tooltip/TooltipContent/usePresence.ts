import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";

/** 没有触发任何 CSS animation 时的兜底卸载延迟（ms） */
export const EXIT_FALLBACK_MS = 300;

export interface UsePresenceOptions {
  /** 逻辑上是否应该打开 */
  visible: Accessor<boolean>;
  /** 真正承载进出场动画的元素（没有它就无法等 animationend） */
  element: Accessor<HTMLElement | undefined>;
  /**
   * 一次性询问"这次关闭是否要跳过退场动画"（例如被同组的另一个浮层抢占，
   * 必须立即卸载以免两个浮层同时出现在屏幕上）。
   */
  consumeSuppressExitAnimation: () => boolean;
  /** 兜底卸载延迟，默认 300ms */
  fallbackMs?: number;
}

/**
 * 退场动画支持（Presence）：
 *
 * `visible` 从 true 变 false 时不立刻卸载节点——先让调用方把 `data-state` 切到
 * closed 触发退场动画，等内容元素自己的 `animationend` 触发后才把 `mounted`
 * 置 false，交给 `<Show>` 卸载。若动画永远不会触发（没装动画库、只用了
 * transition 而自定义样式里没有 @keyframes），则由兜底定时器收尾。
 *
 * 单次关闭只会卸载一次：animationend 与兜底定时器都会在 `onCleanup` 里回收。
 */
export function usePresence(options: UsePresenceOptions): Accessor<boolean> {
  const fallbackMs = options.fallbackMs ?? EXIT_FALLBACK_MS;
  const [mounted, setMounted] = createSignal(options.visible());

  createEffect<boolean>((wasVisible) => {
    const visible = options.visible();
    const element = options.element();

    if (visible) {
      setMounted(true);
    } else if (wasVisible && element) {
      if (options.consumeSuppressExitAnimation()) {
        setMounted(false);
      } else {
        const handleAnimationEnd = (event: AnimationEvent) => {
          // 忽略从子元素冒泡上来的 animationend，只认元素自己播放的那个动画
          if (event.target !== element) return;
          setMounted(false);
        };
        element.addEventListener("animationend", handleAnimationEnd);
        onCleanup(() =>
          element.removeEventListener("animationend", handleAnimationEnd),
        );

        const fallback = window.setTimeout(() => setMounted(false), fallbackMs);
        onCleanup(() => window.clearTimeout(fallback));
      }
    } else {
      // 走到这里必然 !visible（上面的 if 已排除 visible 分支），无需再判一次
      setMounted(false);
    }

    return visible;
  }, options.visible());

  return mounted;
}
