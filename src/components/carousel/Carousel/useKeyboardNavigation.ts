import { type Accessor, createEffect, onCleanup } from "solid-js";
import type { Orientation } from "./Carousel.types";

export interface KeyboardNavigationOptions {
  /** 根元素 accessor：必须响应式，否则 ref 回调赋值后监听器不会补挂 */
  ref: Accessor<HTMLElement | undefined>;
  orientation: Accessor<Orientation>;
  scrollPrev: () => void;
  scrollNext: () => void;
  /** Home / End 跳到第一张 / 最后一张 */
  scrollToStart: () => void;
  scrollToEnd: () => void;
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const { orientation, scrollPrev, scrollNext } = options;

  const handleKeyDown = (e: KeyboardEvent) => {
    const isH = orientation() === "horizontal";
    if ((isH && e.key === "ArrowLeft") || (!isH && e.key === "ArrowUp")) {
      e.preventDefault();
      scrollPrev();
    } else if (
      (isH && e.key === "ArrowRight") ||
      (!isH && e.key === "ArrowDown")
    ) {
      e.preventDefault();
      scrollNext();
    } else if (e.key === "Home") {
      e.preventDefault();
      options.scrollToStart();
    } else if (e.key === "End") {
      e.preventDefault();
      options.scrollToEnd();
    }
  };

  createEffect(() => {
    const element = options.ref();
    if (!element) return;
    element.addEventListener("keydown", handleKeyDown);
    onCleanup(() => element.removeEventListener("keydown", handleKeyDown));
  });
}
