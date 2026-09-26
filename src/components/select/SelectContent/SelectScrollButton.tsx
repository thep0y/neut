import { Show, onCleanup } from "solid-js";
import { ChevronDown, ChevronUp } from "lucide-solid";
import { clsx } from "~/utils";

export interface SelectScrollButtonProps {
  /** "up" 表示向上滚动(按钮固定在顶部)，"down" 反之 */
  direction: "up" | "down";
  /** 当前方向是否还有可滚动的内容 */
  visible: boolean;
  /** 滚动容器(SelectContent 的 listbox) */
  scrollElement: () => HTMLElement | undefined;
}

/**
 * Radix 风格的滚动提示箭头：不显示原生滚动条，用上下箭头提示还有内容，
 * 悬停/按住时用 requestAnimationFrame 持续滚动，滚到边界后调用方会把
 * visible 置为 false，组件卸载并自动停止。
 *
 * 箭头是覆盖在列表上方的装饰元素(`aria-hidden`、不可聚焦)，无障碍仍由
 * listbox 的 aria-activedescendant 承担。
 */
export function SelectScrollButton(props: SelectScrollButtonProps) {
  let frame: number | undefined;

  const stop = () => {
    if (frame !== undefined) {
      cancelAnimationFrame(frame);
      frame = undefined;
    }
  };

  const loop = () => {
    const el = props.scrollElement();
    if (!el) {
      stop();
      return;
    }
    // 每帧约滚动 1/24 高度，连续但不至于过快
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

  const attach = (el: HTMLDivElement) => {
    el.addEventListener("pointerenter", start);
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointerleave", stop);
    el.addEventListener("pointerup", stop);
    el.addEventListener("pointercancel", stop);
    onCleanup(() => {
      stop();
      el.removeEventListener("pointerenter", start);
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
        data-slot="select-scroll-button"
        data-direction={props.direction}
        class={clsx(
          "absolute inset-x-0 z-10 flex h-6 cursor-default items-center justify-center bg-popover text-muted-foreground select-none",
          "[&_svg]:size-4",
          props.direction === "down"
            ? "bottom-0 rounded-b-lg"
            : "top-0 rounded-t-lg",
        )}
      >
        {props.direction === "down" ? <ChevronDown /> : <ChevronUp />}
      </div>
    </Show>
  );
}
