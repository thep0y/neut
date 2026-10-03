import { vi } from "vitest";
import { rect } from "~tests/lib/positioner/test-utils";
import { createSelectMiddleware } from "~/components/select/SelectContent/SelectContent.utils";

/**
 * 选中项对齐算法的测试脚手架。
 *
 * jsdom 不做布局:`offsetTop` / `offsetHeight` / `scrollHeight` 恒为 0，
 * 因此这里显式定义它们来构造真实场景；同时给一个"高大"的视口，
 * 让 expandAbove / expandBelow 主要由内容长度决定，便于断言。
 */
export function setupScrollElement(options: {
  itemOffsetTop: number;
  itemHeight: number;
  scrollHeight: number;
  borderTop?: number;
  borderBottom?: number;
}) {
  const scrollEl = document.createElement("div");
  const item = document.createElement("div");
  item.setAttribute("data-value", "b");

  Object.defineProperty(item, "offsetTop", {
    configurable: true,
    value: options.itemOffsetTop,
  });
  Object.defineProperty(item, "offsetHeight", {
    configurable: true,
    value: options.itemHeight,
  });
  Object.defineProperty(scrollEl, "scrollHeight", {
    configurable: true,
    value: options.scrollHeight,
  });
  Object.defineProperty(scrollEl, "scrollTop", {
    configurable: true,
    writable: true,
    value: 0,
  });

  scrollEl.appendChild(item);
  document.body.appendChild(scrollEl);

  // border 宽度参与面板高度计算（border-box 的 max-height 约束）
  const original = window.getComputedStyle;
  window.getComputedStyle = ((el: Element) =>
    el === scrollEl
      ? ({
          borderTopWidth: `${options.borderTop ?? 0}px`,
          borderBottomWidth: `${options.borderBottom ?? 0}px`,
        } as CSSStyleDeclaration)
      : original(el)) as typeof window.getComputedStyle;

  return {
    scrollEl,
    item,
    restore: () => {
      window.getComputedStyle = original;
      scrollEl.remove();
    },
  };
}

/** 取出 createSelectMiddleware 里的 itemAlign 并执行 */
export function runItemAlign(options: {
  selectedValue: string | number | null | undefined;
  scrollEl: HTMLElement | undefined;
  referenceRect: ReturnType<typeof rect>;
}) {
  const middleware = createSelectMiddleware({
    hasValue: true,
    selectedValue: () => options.selectedValue,
    scrollElement: () => options.scrollEl,
    placement: "bottom",
    collisionPadding: 8,
    onAvailableHeightChange: () => {},
  });
  const itemAlign = middleware.find((m) => m.name === "itemAlign")!;

  return itemAlign.fn({
    x: 0,
    y: 0,
    placement: "bottom",
    initialPlacement: "bottom",
    strategy: "fixed",
    rects: {
      reference: options.referenceRect,
      floating: rect(0, 0, 200, 320),
    },
    elements: {
      reference: {} as Element,
      floating: {} as HTMLElement,
    },
    middlewareData: {},
  });
}

/** jsdom 下视口尺寸默认 0，显式给一个足够大的视口 */
export function withTallViewport(fn: () => void, height = 800) {
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    value: 1000,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    configurable: true,
    value: height,
  });
  try {
    fn();
  } finally {
    Reflect.deleteProperty(document.documentElement, "clientWidth");
    Reflect.deleteProperty(document.documentElement, "clientHeight");
  }
}

void vi;
