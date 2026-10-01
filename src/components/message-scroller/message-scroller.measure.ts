/**
 * MessageScroller 的 CSS 尺寸测量。
 *
 * 单一职责：把 `getComputedStyle` 的字符串值解析成可运算的数字。
 * 不持有信号、不订阅事件、不做滚动决策，因此可以脱离 jsdom 布局限制直接单测。
 */

/** 一个元素在主轴方向上的内边距 */
export interface PaddingBox {
  /** 逻辑块起始内边距（`padding-block-start`，回退到 `padding-top`） */
  start: number;
  /** 逻辑块结束内边距（`padding-block-end`，回退到 `padding-bottom`） */
  end: number;
}

/** 把 `"12px"` 之类的 CSS 长度解析成数字；非法值一律当 0 */
export function parsePx(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * 读取元素的块级内边距。
 * 优先用逻辑属性（`paddingBlockStart`），因为它能正确处理书写方向；
 * 不支持时回退到物理属性（`paddingTop`）。
 */
export function paddingBox(element: HTMLElement): PaddingBox {
  const style = window.getComputedStyle(element);
  return {
    start: parsePx(style.paddingBlockStart || style.paddingTop),
    end: parsePx(style.paddingBlockEnd || style.paddingBottom),
  };
}

/**
 * 读取容器的行间距。
 * 显式设置过行间距时 `rowGap` 有值，否则它是 `"normal"`——此时应读 `gap`
 * 简写（`gap: 8px` 不会展开到 `rowGap`）。
 */
export function rowGap(element: HTMLElement | null): number {
  if (!element) return 0;
  const style = window.getComputedStyle(element);
  return parsePx(style.rowGap === "normal" ? style.gap : style.rowGap);
}
