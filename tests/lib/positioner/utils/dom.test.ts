import { describe, expect, it } from "vitest";
import { asDOMRect, rect } from "~tests/lib/positioner/test-utils";
import {
  getOverflowAncestors,
  getRectRelativeTo,
  getViewportBoundary,
  getViewportRect,
  isOverflowElement,
} from "~/lib/positioner/utils/dom";

function elWithRect(r: ReturnType<typeof rect>): HTMLElement {
  const el = document.createElement("div");
  el.getBoundingClientRect = () => asDOMRect(r);
  return el;
}

/** jsdom 的 clientWidth/Height 默认 0，显式设置以构造非退化视口 */
function withViewport(width: number, height: number, fn: () => void) {
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    value: width,
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

/** 覆盖 getComputedStyle 让指定元素报告 overflow */
function withOverflow(el: Element, overflow: string, fn: () => void) {
  const original = window.getComputedStyle;
  window.getComputedStyle = ((target: Element) =>
    target === el
      ? ({ overflow, overflowX: "", overflowY: "" } as CSSStyleDeclaration)
      : original(target)) as typeof window.getComputedStyle;
  try {
    fn();
  } finally {
    window.getComputedStyle = original;
  }
}

/** 临时把 window.scrollX/scrollY 设为指定值 */
function withScroll(x: number, y: number, fn: () => void) {
  const originalX = window.scrollX;
  const originalY = window.scrollY;
  Object.defineProperty(window, "scrollX", { configurable: true, value: x });
  Object.defineProperty(window, "scrollY", { configurable: true, value: y });
  try {
    fn();
  } finally {
    Object.defineProperty(window, "scrollX", {
      configurable: true,
      value: originalX,
    });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: originalY,
    });
  }
}

describe("getViewportRect", () => {
  it("只取 rect 的 xywh（丢弃 top/right/bottom/left/toJSON）", () => {
    const el = elWithRect(rect(10, 20, 30, 40));

    expect(getViewportRect(el)).toEqual({
      x: 10,
      y: 20,
      width: 30,
      height: 40,
    });
  });

  it("虚拟参照元素同样适用", () => {
    const virtual = {
      getBoundingClientRect: () => asDOMRect(rect(1, 2, 3, 4)),
    };

    expect(getViewportRect(virtual)).toEqual({
      x: 1,
      y: 2,
      width: 3,
      height: 4,
    });
  });
});

describe("getRectRelativeTo", () => {
  it("fixed 策略下直接用视口坐标，不叠加滚动", () => {
    const el = elWithRect(rect(10, 20, 30, 40));

    withScroll(500, 300, () => {
      expect(getRectRelativeTo(el, "fixed")).toEqual({
        x: 10,
        y: 20,
        width: 30,
        height: 40,
      });
    });
  });

  it("absolute 策略下叠加页面滚动换算成文档坐标", () => {
    const el = elWithRect(rect(10, 20, 30, 40));

    withScroll(500, 300, () => {
      expect(getRectRelativeTo(el, "absolute")).toEqual({
        x: 510,
        y: 320,
        width: 30,
        height: 40,
      });
    });
  });

  it("scrollX/scrollY 缺失时回退到 pageXOffset/pageYOffset", () => {
    const el = elWithRect(rect(10, 20, 30, 40));
    const originalX = window.scrollX;
    const originalY = window.scrollY;
    // 移除 scrollX/scrollY，暴露 pageXOffset/pageYOffset 兜底分支
    Reflect.deleteProperty(window, "scrollX");
    Reflect.deleteProperty(window, "scrollY");
    Object.defineProperty(window, "pageXOffset", {
      configurable: true,
      value: 7,
    });
    Object.defineProperty(window, "pageYOffset", {
      configurable: true,
      value: 9,
    });

    try {
      expect(getRectRelativeTo(el, "absolute")).toEqual({
        x: 17,
        y: 29,
        width: 30,
        height: 40,
      });
    } finally {
      Object.defineProperty(window, "scrollX", {
        configurable: true,
        value: originalX,
      });
      Object.defineProperty(window, "scrollY", {
        configurable: true,
        value: originalY,
      });
      Reflect.deleteProperty(window, "pageXOffset");
      Reflect.deleteProperty(window, "pageYOffset");
    }
  });
});

describe("getViewportBoundary", () => {
  it("fixed 策略下不叠加滚动偏移", () => {
    withViewport(1000, 800, () => {
      withScroll(500, 300, () => {
        expect(getViewportBoundary("fixed")).toEqual({
          x: 0,
          y: 0,
          width: 1000,
          height: 800,
        });
      });
    });
  });

  it("absolute 策略下叠加滚动偏移", () => {
    withViewport(1000, 800, () => {
      withScroll(500, 300, () => {
        expect(getViewportBoundary("absolute")).toEqual({
          x: 500,
          y: 300,
          width: 1000,
          height: 800,
        });
      });
    });
  });

  it("padding 同时收缩位置与尺寸", () => {
    withViewport(1000, 800, () => {
      expect(getViewportBoundary("fixed", 20)).toEqual({
        x: 20,
        y: 20,
        width: 960,
        height: 760,
      });
    });
  });

  it("padding 缺省为 0", () => {
    withViewport(1000, 800, () => {
      expect(getViewportBoundary("fixed").width).toBe(1000);
    });
  });

  it("absolute 下 scrollX/scrollY 缺失时回退 pageX/YOffset", () => {
    const originalX = window.scrollX;
    const originalY = window.scrollY;
    Reflect.deleteProperty(window, "scrollX");
    Reflect.deleteProperty(window, "scrollY");
    Object.defineProperty(window, "pageXOffset", {
      configurable: true,
      value: 5,
    });
    Object.defineProperty(window, "pageYOffset", {
      configurable: true,
      value: 6,
    });

    withViewport(1000, 800, () => {
      try {
        expect(getViewportBoundary("absolute")).toEqual({
          x: 5,
          y: 6,
          width: 1000,
          height: 800,
        });
      } finally {
        Object.defineProperty(window, "scrollX", {
          configurable: true,
          value: originalX,
        });
        Object.defineProperty(window, "scrollY", {
          configurable: true,
          value: originalY,
        });
        Reflect.deleteProperty(window, "pageXOffset");
        Reflect.deleteProperty(window, "pageYOffset");
      }
    });
  });
});

describe("isOverflowElement", () => {
  it.each([
    ["auto", true],
    ["scroll", true],
    ["overlay", true],
    ["hidden", true],
    ["visible", false],
    ["clip", false],
  ])("overflow=%s 时返回 %s", (overflow, expected) => {
    const el = document.createElement("div");

    withOverflow(el, overflow, () => {
      expect(isOverflowElement(el)).toBe(expected);
    });
  });
});

describe("getOverflowAncestors", () => {
  it("结果末尾总是包含 window", () => {
    const node = document.createElement("div");
    document.body.appendChild(node);

    const ancestors = getOverflowAncestors(node);

    expect(ancestors.at(-1)).toBe(window);
    node.remove();
  });

  it("只收集建立了滚动容器的祖先", () => {
    const outer = document.createElement("div");
    const inner = document.createElement("div");
    const node = document.createElement("span");
    outer.appendChild(inner);
    inner.appendChild(node);
    document.body.appendChild(outer);

    withOverflow(inner, "auto", () => {
      const ancestors = getOverflowAncestors(node);

      expect(ancestors).toContain(inner);
      expect(ancestors).not.toContain(outer);
    });

    outer.remove();
  });

  it("没有可滚动祖先时只返回 window", () => {
    const node = document.createElement("div");
    document.body.appendChild(node);

    const ancestors = getOverflowAncestors(node);

    expect(ancestors).toEqual([window]);
    node.remove();
  });
});
