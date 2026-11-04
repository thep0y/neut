import { createSignal, onCleanup, type Accessor } from "solid-js";
import type { Orientation } from "../Carousel/Carousel.types";

export interface UseCarouselTouchDragOptions {
  orientation: Accessor<Orientation>;
  itemSize: Accessor<number>;
  scrollPrev: () => void;
  scrollNext: () => void;
}

export interface UseCarouselTouchDragResult {
  /** 拖动过程中的额外位移（像素），叠加到 track 的 translate 上 */
  dragOffset: Accessor<number>;
  /** 是否正在拖动（用于关闭 transition） */
  dragging: Accessor<boolean>;
  /** 由 viewport 的 ref 调用，绑定 pointerdown；卸载时自动解绑 */
  attach: (element: HTMLElement) => void;
}

/**
 * 触摸/触控笔横向（或纵向）拖拽翻页。
 *
 * 只接管 touch / pen：鼠标拖动会干扰桌面端的文本选择与点击，
 * 桌面端继续用前后按钮/键盘。手势方向由视图上的 touch-pan-* 决定：
 * 水平轮播用 touch-pan-y（浏览器保留纵向滚动），垂直轮播反之。
 */
export function useCarouselTouchDrag(
  options: UseCarouselTouchDragOptions,
): UseCarouselTouchDragResult {
  const [dragOffset, setDragOffset] = createSignal(0);
  const [dragging, setDragging] = createSignal(false);

  let detach = () => {};

  const attach = (el: HTMLElement) => {
    detach();

    let pointerId = 0;
    let start = 0;
    let delta = 0;

    const finish = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    const onDown = (event: Event) => {
      const pointer = event as PointerEvent;
      if (pointer.pointerType === "mouse") return;

      pointerId = pointer.pointerId;
      start =
        options.orientation() === "horizontal"
          ? pointer.clientX
          : pointer.clientY;
      delta = 0;
      setDragOffset(0);
      setDragging(true);

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    };

    const onMove = (event: Event) => {
      const pointer = event as PointerEvent;
      if (pointer.pointerId !== pointerId) return;

      const current =
        options.orientation() === "horizontal"
          ? pointer.clientX
          : pointer.clientY;
      delta = current - start;
      setDragOffset(delta);
    };

    const onUp = (event: Event) => {
      const pointer = event as PointerEvent;
      if (pointer.pointerId !== pointerId) return;

      finish();
      setDragging(false);
      setDragOffset(0);

      const threshold = Math.max(24, options.itemSize() * 0.15);
      if (delta <= -threshold) options.scrollNext();
      else if (delta >= threshold) options.scrollPrev();
    };

    el.addEventListener("pointerdown", onDown);
    detach = () => {
      el.removeEventListener("pointerdown", onDown);
      finish();
    };
  };

  onCleanup(() => detach());

  return { dragOffset, dragging, attach };
}
