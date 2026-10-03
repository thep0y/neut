import type { Accessor } from "solid-js";
import { paddingBox } from "./message-scroller.measure";

/**
 * MessageScroller 的 DOM 几何测量。
 *
 * 单一职责：只回答"行在哪里""内容有多高""还能滚多远"。不读 props、不写任何状态、
 * 不订阅事件——所有输入都是元素 accessor，因此可以脱离引擎单独驱动
 * （jsdom 不做布局，测试里用可控坐标系 stub 矩形即可）。
 */

export interface DomMeasureOptions {
  /** 滚动容器 */
  viewport: Accessor<HTMLElement | undefined>;
  /** 会话容器（`role="log"` 的那一层） */
  content: Accessor<HTMLElement | undefined>;
  /** 内部尾部 spacer（不属于内容，测量时必须排除） */
  spacer: Accessor<HTMLElement | undefined>;
}

export interface DomMeasure {
  /** content 的直接子元素，排除内部 spacer */
  items: () => HTMLElement[];
  /** 行相对滚动容器内容顶部的偏移（用测量，避免 offsetParent 不确定） */
  itemOffsetTop: (element: HTMLElement) => number;
  /** 行相对视口顶部的偏移 */
  itemTopInViewport: (element: HTMLElement) => number;
  /** 内容底部（不含 spacer），即内容真实滚动高度 */
  contentBottom: () => number;
  /** 最大可滚动距离 */
  maxScrollTop: () => number;
}

export function createDomMeasure(options: DomMeasureOptions): DomMeasure {
  const items = (): HTMLElement[] => {
    const root = options.content();
    const spacer = options.spacer();
    if (!root) return [];
    return Array.from(root.children).filter(
      (child): child is HTMLElement =>
        child instanceof HTMLElement && child !== spacer,
    );
  };

  const itemOffsetTop = (element: HTMLElement) => {
    const viewport = options.viewport();
    if (!viewport) return 0;
    return (
      element.getBoundingClientRect().top -
      viewport.getBoundingClientRect().top +
      viewport.scrollTop
    );
  };

  const itemTopInViewport = (element: HTMLElement) => {
    const viewport = options.viewport();
    if (!viewport) return 0;
    return (
      element.getBoundingClientRect().top - viewport.getBoundingClientRect().top
    );
  };

  const contentBottom = () => {
    const viewport = options.viewport();
    const root = options.content();
    if (!viewport || !root) return 0;

    const pad = paddingBox(root);
    const viewportRect = viewport.getBoundingClientRect();
    let bottom = pad.start + pad.end;
    for (const item of items()) {
      const rect = item.getBoundingClientRect();
      bottom = Math.max(
        bottom,
        rect.bottom - viewportRect.top + viewport.scrollTop + pad.end,
      );
    }
    return bottom;
  };

  const maxScrollTop = () => {
    const viewport = options.viewport();
    return viewport
      ? Math.max(0, viewport.scrollHeight - viewport.clientHeight)
      : 0;
  };

  return {
    items,
    itemOffsetTop,
    itemTopInViewport,
    contentBottom,
    maxScrollTop,
  };
}
