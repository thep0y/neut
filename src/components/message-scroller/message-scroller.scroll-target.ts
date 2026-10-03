/**
 * MessageScroller 的滚动目标计算。
 *
 * 单一职责：已知行与视口的测量值时，算出应该滚到的 `scrollTop`。
 * 纯函数（不读信号、不写 DOM），因此四种 `align` 的每个分支都能单独断言。
 */

import type { MessageScrollerScrollOptions } from "./message-scroller.types";
import { type PaddingBox, paddingBox } from "./message-scroller.measure";

/** 计算滚动目标所需的输入（都是测量好的数字，便于单独测试各分支） */
export interface TargetTopInput {
  /** 行相对滚动内容顶部的偏移 */
  itemTop: number;
  /** 行自身高度 */
  itemHeight: number;
  /** 视口可视高度 */
  viewportHeight: number;
  /** 当前 `scrollTop`（`align: "nearest"` 需要） */
  scrollTop: number;
  /** 内容区上下内边距 */
  padding: PaddingBox;
  /** 额外留白（scrollMargin + peek） */
  margin: number;
}

/**
 * 按 `align` 计算目标 `scrollTop`：
 * - `start`（默认）：行顶对齐可视区顶部（减内边距与留白）
 * - `center`：行居中于可视区
 * - `end`：行底对齐可视区底部
 * - `nearest`：完全可见则不动，否则滚到最近的一侧
 */
export function computeTargetTop(
  align: MessageScrollerScrollOptions["align"],
  {
    itemTop,
    itemHeight,
    viewportHeight,
    scrollTop,
    padding,
    margin,
  }: TargetTopInput,
): number {
  switch (align ?? "start") {
    case "center": {
      const visible = Math.max(0, viewportHeight - padding.start - padding.end);
      return itemTop - padding.start - (visible - itemHeight) / 2 - margin;
    }
    case "end":
      return itemTop - viewportHeight + itemHeight + padding.end + margin;
    case "nearest": {
      const bottom = itemTop + itemHeight;
      const viewTop = scrollTop + padding.start;
      const viewBottom = scrollTop + viewportHeight - padding.end;
      if (itemTop >= viewTop && bottom <= viewBottom) return scrollTop;
      if (itemTop < viewTop) return itemTop - padding.start - margin;
      return bottom - viewportHeight + padding.end + margin;
    }
    default:
      return itemTop - padding.start - margin;
  }
}

/** 便捷包装：直接从元素读取尺寸（引擎的热路径用这个） */
export function targetTopFor(
  element: HTMLElement,
  command: MessageScrollerScrollOptions | undefined,
  margin: number,
  viewport: HTMLElement,
  content: HTMLElement | undefined,
  itemOffsetTop: (el: HTMLElement) => number,
): number {
  return computeTargetTop(command?.align, {
    itemTop: itemOffsetTop(element),
    itemHeight: element.getBoundingClientRect().height,
    viewportHeight: viewport.clientHeight,
    scrollTop: viewport.scrollTop,
    padding: content ? paddingBox(content) : { start: 0, end: 0 },
    margin,
  });
}
