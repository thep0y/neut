/**
 * ScrollBar 的交互逻辑：拖动滑块、点击 track、键盘滚动。
 *
 * 单一职责：绑定/解绑 DOM 事件并把「用户意图」翻译成滚动位置写入，
 * 计算部分委托给 `ScrollBar.utils.ts`；不关心样式、ARIA 与可见性。
 */

import { type Accessor, onCleanup } from "solid-js";
import {
  applyScrollPos,
  isVertical,
  keyboardScrollDelta,
  maxScrollOf,
  type Orientation,
  pointerCoord,
  scrollFromDrag,
  scrollFromKeyboard,
  scrollFromTrackClick,
  scrollPosOf,
  thumbDragRatio,
} from "./ScrollBar.utils";

interface Options {
  /** track 元素访问器（拖动比例、点击换算都要读它的尺寸） */
  track: () => HTMLDivElement | undefined;
  /** 被滚动容器的访问器 */
  viewport: () => HTMLDivElement | undefined;
  /** 当前滚动轴 */
  orientation: Accessor<Orientation>;
  /** 拖动开始/结束的回调（组件用它维护 dragging 状态） */
  onDragChange: (dragging: boolean) => void;
}

export interface ScrollBarInteraction {
  onThumbPointerDown: (event: PointerEvent) => void;
  onTrackPointerDown: (event: PointerEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export function useScrollBarInteraction({
  track,
  viewport,
  orientation,
  onDragChange,
}: Options): ScrollBarInteraction {
  /** 拖动期间挂到 window 上的监听器，用于组件卸载时兜底清理 */
  let detach: (() => void) | null = null;

  onCleanup(() => detach?.());

  /**
   * 拖动滑块：把指针位移按「滚动距离 / 可用轨道长度」的比例映射成滚动位置。
   * 监听挂在 window 上，指针移出 track 也继续跟手。
   */
  const onThumbPointerDown = (event: PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const vp = viewport();
    const el = track();
    const thumb = event.currentTarget as HTMLDivElement | null;
    if (!vp || !el || !thumb) return;

    const axis = orientation();
    const vertical = isVertical(axis);
    const startPointer = pointerCoord(axis, event);
    const startScroll = scrollPosOf(axis, vp);
    const maxScroll = maxScrollOf(axis, vp);
    const trackSize = vertical ? el.clientHeight : el.clientWidth;
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
      onDragChange(false);
    };

    onDragChange(true);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  /**
   * 点击 track：按点击比例平滑滚到对应位置。
   *
   * 点击滑块时不会走到这里——滑块自己的 pointerdown handler 会 `stopPropagation()`，
   * 因此无需再判断 `event.target`（原实现里那条判断在真实 DOM 与 jsdom 中均不可达，
   * 已用变异测试确认删除后所有用例仍通过）。
   */
  const onTrackPointerDown = (event: PointerEvent) => {
    const vp = viewport();
    const el = track();
    if (!vp || !el) return;

    const axis = orientation();
    const target = scrollFromTrackClick(
      axis,
      el.getBoundingClientRect(),
      event,
      maxScrollOf(axis, vp),
    );
    vp.scrollTo({
      [isVertical(axis) ? "top" : "left"]: target,
      behavior: "smooth",
    });
  };

  /** 键盘滚动：方向键小步、Page 键翻页、Home/End 到两端 */
  const onKeyDown = (event: KeyboardEvent) => {
    const vp = viewport();
    if (!vp) return;

    const axis = orientation();
    const pageSize = isVertical(axis) ? vp.clientHeight : vp.clientWidth;
    const delta = keyboardScrollDelta(event.key, pageSize);
    if (delta === undefined) return;

    event.preventDefault();
    const scrollSize = isVertical(axis) ? vp.scrollHeight : vp.scrollWidth;
    const max = maxScrollOf(axis, vp);
    applyScrollPos(
      axis,
      vp,
      scrollFromKeyboard(scrollPosOf(axis, vp), delta, max, scrollSize),
    );
  };

  return { onThumbPointerDown, onTrackPointerDown, onKeyDown };
}
