import { Show, onCleanup } from "solid-js";
import { ChevronDown, ChevronUp } from "lucide-solid";
import { clsx } from "~/utils";
import type { ScrollArrowButtonProps } from "./ScrollArrows.types";

/** 悬停/按住开始滚动前的停留时间,避免只是掠过或点击边缘时误触发 */
const HOVER_SCROLL_DELAY = 150;

/**
 * 单个滚动提示箭头,覆盖在列表上/下沿。
 *
 * 默认是**装饰性**的(`interactive=false`):`pointer-events-none`,不参与指针命中,
 * 因此不会挡住列表项、也不会出现"箭头显隐 → pointerenter → 自动滚动"的互相触发。
 *
 * `interactive` 为 true 时,悬停(短暂停留后)或按住会用 requestAnimationFrame 持续
 * 滚动目标容器,并在以下任一情况停止:指针离开/抬起/取消、方向已到边界、
 * 或箭头本身变为不可见(退出时不再继续滚动)。
 */
export function ScrollArrowButton(props: ScrollArrowButtonProps) {
  let frame: number | undefined;
  let enterTimer: number | undefined;

  const stop = () => {
    if (enterTimer !== undefined) {
      window.clearTimeout(enterTimer);
      enterTimer = undefined;
    }
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
      frame = undefined;
    }
  };

  const loop = () => {
    // 箭头被隐藏(到达边界/列表变短)时立即停止,避免"不可见却持续滚动"
    if (!props.visible) {
      stop();
      return;
    }
    const el = props.target();
    if (!el) {
      stop();
      return;
    }
    const step = Math.max(4, el.clientHeight / 24);
    const before = el.scrollTop;
    el.scrollTop = before + (props.direction === "down" ? step : -step);
    if (el.scrollTop === before) {
      stop();
      return;
    }
    frame = requestAnimationFrame(loop);
  };

  const start = () => {
    stop();
    frame = requestAnimationFrame(loop);
  };

  const startDelayed = () => {
    stop();
    enterTimer = window.setTimeout(() => {
      enterTimer = undefined;
      start();
    }, HOVER_SCROLL_DELAY);
  };

  const attach = (el: HTMLDivElement) => {
    if (!props.interactive) return;
    el.addEventListener("pointerenter", startDelayed);
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointerleave", stop);
    el.addEventListener("pointerup", stop);
    el.addEventListener("pointercancel", stop);
    onCleanup(() => {
      stop();
      el.removeEventListener("pointerenter", startDelayed);
      el.removeEventListener("pointerdown", start);
      el.removeEventListener("pointerleave", stop);
      el.removeEventListener("pointerup", stop);
      el.removeEventListener("pointercancel", stop);
    });
  };

  return (
    <Show when={props.visible}>
      <div
        ref={attach}
        aria-hidden="true"
        data-slot="scroll-arrow"
        data-direction={props.direction}
        data-interactive={props.interactive ? "" : undefined}
        class={clsx(
          "absolute inset-x-0 z-10 flex h-6 select-none items-center justify-center bg-popover text-muted-foreground [&_svg]:size-4",
          props.interactive ? "cursor-default" : "pointer-events-none",
          props.direction === "down" ? "bottom-0" : "top-0",
          props.class,
        )}
      >
        {props.direction === "down" ? <ChevronDown /> : <ChevronUp />}
      </div>
    </Show>
  );
}
