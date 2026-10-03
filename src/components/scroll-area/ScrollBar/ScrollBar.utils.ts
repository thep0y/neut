/**
 * ScrollBar 的纯计算逻辑。
 *
 * 单一职责：只做「几何/数值换算」，不碰 DOM 事件、不持有信号、不渲染。
 * 这样滚动条的核心数学可以脱离 jsdom 的布局限制被直接单测。
 */

import type { ScrollMetrics } from "../ScrollArea/ScrollArea.types";

/** 滑块最小长度（px），保证任何比例下都点得到 */
export const MIN_THUMB_PX = 20;
/** track 的内边距（Tailwind `p-px`），由 track 尺寸减去得到内容区 */
export const TRACK_PADDING_PX = 2;
/** 键盘每按一次的滚动步长（px） */
export const KEYBOARD_STEP_PX = 40;

export type Orientation = "horizontal" | "vertical";

export function isVertical(orientation: Orientation): boolean {
  return orientation === "vertical";
}

/**
 * 滑块的内联样式：先按比例算出长度并用 `MIN_THUMB_PX` 夹住，
 * 再按夹住后的可用空间重算位移，保证滑块永远不溢出 track。
 */
export function computeThumbStyle(
  orientation: Orientation,
  metrics: ScrollMetrics,
  trackSize: number,
): { height?: string; width?: string; transform: string } {
  const trackInnerSize = trackSize - TRACK_PADDING_PX;
  const thumbSize = Math.max(trackInnerSize * metrics.thumbRatio, MIN_THUMB_PX);
  const maxOffset = Math.max(0, trackInnerSize - thumbSize);
  const offset = maxOffset * metrics.thumbOffset;

  return isVertical(orientation)
    ? { height: `${thumbSize}px`, transform: `translateY(${offset}px)` }
    : { width: `${thumbSize}px`, transform: `translateX(${offset}px)` };
}

/** ARIA `aria-valuenow`：0–100 的整数滚动位置 */
export function computeAriaValueNow(metrics: ScrollMetrics): number {
  return Math.round(metrics.thumbOffset * 100);
}

/** 每次按下/移动时沿当前轴读取指针坐标 */
export function pointerCoord(
  orientation: Orientation,
  event: PointerEvent,
): number {
  return isVertical(orientation) ? event.clientY : event.clientX;
}

/** 当前轴的最大可滚动距离 */
export function maxScrollOf(
  orientation: Orientation,
  viewport: HTMLElement,
): number {
  return isVertical(orientation)
    ? viewport.scrollHeight - viewport.clientHeight
    : viewport.scrollWidth - viewport.clientWidth;
}

/** 当前轴的滚动位置 */
export function scrollPosOf(
  orientation: Orientation,
  viewport: HTMLElement,
): number {
  return isVertical(orientation) ? viewport.scrollTop : viewport.scrollLeft;
}

/** 把滚动位置写回当前轴 */
export function applyScrollPos(
  orientation: Orientation,
  viewport: HTMLElement,
  value: number,
): void {
  if (isVertical(orientation)) {
    viewport.scrollTop = value;
  } else {
    viewport.scrollLeft = value;
  }
}

/**
 * 拖动滑块时的「像素位移 → 滚动距离」比例。
 * 分母是 track 内容区减去滑块长度；为 0（滑块占满 track）时返回 1 以避免除零。
 */
export function thumbDragRatio(
  maxScroll: number,
  trackSize: number,
  thumbSize: number,
): number {
  const denominator = trackSize - TRACK_PADDING_PX - thumbSize;
  return denominator === 0 ? 1 : maxScroll / denominator;
}

/** 按比例把拖动位移映射成新滚动位置（夹在 [0, maxScroll]） */
export function scrollFromDrag(
  startScroll: number,
  deltaPx: number,
  ratio: number,
  maxScroll: number,
): number {
  return Math.max(0, Math.min(maxScroll, startScroll + deltaPx * ratio));
}

/**
 * 点击 track 空白处时的目标滚动位置：按点击点在 track 上的比例换算。
 * `rect` 尺寸为 0（jsdom 无布局）时返回 0，避免 NaN。
 */
export function scrollFromTrackClick(
  orientation: Orientation,
  rect: { top: number; left: number; height: number; width: number },
  event: PointerEvent,
  maxScroll: number,
): number {
  const size = isVertical(orientation) ? rect.height : rect.width;
  if (size === 0) return 0;
  const offset = isVertical(orientation)
    ? event.clientY - rect.top
    : event.clientX - rect.left;
  return (offset / size) * maxScroll;
}

/** 键盘按键 → 滚动增量；不可识别的键返回 `undefined`（调用方跳过） */
export function keyboardScrollDelta(
  key: string,
  pageSize: number,
): number | undefined {
  const keyMap: Record<string, number> = {
    ArrowDown: KEYBOARD_STEP_PX,
    ArrowRight: KEYBOARD_STEP_PX,
    ArrowUp: -KEYBOARD_STEP_PX,
    ArrowLeft: -KEYBOARD_STEP_PX,
    PageDown: pageSize,
    PageUp: -pageSize,
    Home: -Infinity,
    End: Infinity,
  };
  return keyMap[key];
}

/**
 * 把键盘增量应用到 [0, max] 区间。
 * `delta` 为 ±Infinity 时分别落到两端（Home / End 语义）。
 * 注意：这里用 `scrollSize` 而不是 `max` 作为 End 的目标，保留原有行为
 * （浏览器会自动夹到最大值）。
 */
export function scrollFromKeyboard(
  current: number,
  delta: number,
  max: number,
  scrollSize: number,
): number {
  if (delta === Infinity) return scrollSize;
  if (delta === -Infinity) return 0;
  return Math.max(0, Math.min(max, current + delta));
}

/** 可见性：悬停、正在拖动当前轴、或滑块处于按压态 */
export function isScrollBarVisible(
  hovering: boolean,
  dragging: "horizontal" | "vertical" | null,
  orientation: Orientation,
  active: boolean,
): boolean {
  return hovering || dragging === orientation || active;
}
