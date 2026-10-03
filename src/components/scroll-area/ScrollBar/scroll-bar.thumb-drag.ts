import type { Accessor } from "solid-js";
import {
  applyScrollPos,
  isVertical,
  maxScrollOf,
  type Orientation,
  pointerCoord,
  scrollFromDrag,
  scrollPosOf,
  thumbDragRatio,
} from "./ScrollBar.utils";

export interface ThumbDragContext {
  /** track 元素（拖动比例、点击换算都要读它的尺寸） */
  track: () => HTMLDivElement | undefined;
  /** 被滚动容器 */
  viewport: () => HTMLDivElement | undefined;
  orientation: Accessor<Orientation>;
  /** 拖动开始/结束（组件用它维护 active 高亮） */
  onDragChange: (dragging: boolean) => void;
}

export interface ThumbDragSession {
  /** 开始一次拖动；viewport / track / thumb 缺一不可，前置条件不足时什么都不做 */
  start: (event: PointerEvent) => void;
  /** 结束并解绑（组件卸载时兜底调用） */
  dispose: () => void;
}

/**
 * 拖动滑块的一次会话。
 *
 * 单一职责：把指针位移按「滚动距离 / 可用轨道长度」的比例映射成滚动位置。
 * 监听挂在 window 上（指针移出 track 也继续跟手），结束后统一解绑；
 * 具体的比例与坐标换算委托给 `ScrollBar.utils`。
 */
export function createThumbDrag(ctx: ThumbDragContext): ThumbDragSession {
  /** 拖动期间挂到 window 上的解绑函数，用于卸载兜底 */
  let detach: (() => void) | null = null;

  const start = (event: PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const vp = ctx.viewport();
    const track = ctx.track();
    const thumb = event.currentTarget as HTMLDivElement | null;
    if (!vp || !track || !thumb) return;

    const axis = ctx.orientation();
    const vertical = isVertical(axis);
    const startPointer = pointerCoord(axis, event);
    const startScroll = scrollPosOf(axis, vp);
    const maxScroll = maxScrollOf(axis, vp);
    const trackSize = vertical ? track.clientHeight : track.clientWidth;
    const thumbSize = vertical ? thumb.clientHeight : thumb.clientWidth;
    const ratio = thumbDragRatio(maxScroll, trackSize, thumbSize);

    const onMove = (moveEvent: PointerEvent) => {
      const delta = pointerCoord(axis, moveEvent) - startPointer;
      applyScrollPos(
        axis,
        vp,
        scrollFromDrag(startScroll, delta, ratio, maxScroll),
      );
    };

    const onUp = () => detach?.();

    detach = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      detach = null;
      ctx.onDragChange(false);
    };

    ctx.onDragChange(true);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return {
    start,
    dispose() {
      detach?.();
    },
  };
}
