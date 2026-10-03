import { describe, expect, it } from "vitest";
import {
  asDOMRect,
  middlewareState,
  rect,
} from "~tests/lib/positioner/test-utils";
import { arrow } from "~/lib/positioner/middleware/arrow";

/** 构造一个带可控 getBoundingClientRect 的箭头元素 */
function arrowElement(width: number, height: number): Element {
  const el = document.createElement("div");
  el.getBoundingClientRect = () => asDOMRect(rect(0, 0, width, height));
  return el;
}

/**
 * 设置 floating 元素"现读现用"的尺寸（arrow 会重新 measure floating）。
 * `state.rects.floating` 与 `elements.floating` 的尺寸故意可以不同，
 * 用来验证 arrow 用的是后者（实时值）。
 */
function stateWithFloating(options: {
  placement: Parameters<typeof middlewareState>[0]["placement"];
  x: number;
  y: number;
  reference?: ReturnType<typeof rect>;
  floatingSize: { width: number; height: number };
}) {
  const floating = document.createElement("div");
  floating.getBoundingClientRect = () =>
    asDOMRect(
      rect(0, 0, options.floatingSize.width, options.floatingSize.height),
    );

  const state = middlewareState({
    x: options.x,
    y: options.y,
    placement: options.placement,
    reference: options.reference ?? rect(0, 0, 100, 40),
    floating: rect(
      0,
      0,
      options.floatingSize.width,
      options.floatingSize.height,
    ),
  });
  state.elements.floating = floating;
  return state;
}

describe("arrow", () => {
  it("middleware 名为 arrow", () => {
    expect(arrow({ element: undefined }).name).toBe("arrow");
  });

  it("元素缺失时只返回 side，不产出坐标", () => {
    const result = arrow({ element: undefined }).fn(
      middlewareState({ x: 0, y: 0, placement: "bottom" }),
    );

    expect(result.data).toEqual({ side: "bottom" });
  });

  it("元素访问器返回 undefined 时同样只返回 side", () => {
    const result = arrow({ element: () => undefined }).fn(
      middlewareState({ x: 0, y: 0, placement: "top" }),
    );

    expect(result.data).toEqual({ side: "top" });
  });

  it("竖直方向对齐到参照物中心（bottom）", () => {
    const result = arrow({
      element: arrowElement(10, 10),
      padding: 4,
    }).fn(
      stateWithFloating({
        placement: "bottom",
        x: 100,
        y: 0,
        reference: rect(100, 0, 100, 40),
        floatingSize: { width: 200, height: 100 },
      }),
    );

    // refCenter = 100 + 50 - 100 = 50；50 - 5 = 45
    expect(result.data).toEqual({ x: 45, side: "bottom" });
  });

  it("水平方向对齐到参照物中心（right），产出 y", () => {
    const result = arrow({ element: arrowElement(10, 10) }).fn(
      stateWithFloating({
        placement: "right",
        x: 200,
        y: 100,
        reference: rect(100, 100, 100, 40),
        floatingSize: { width: 100, height: 200 },
      }),
    );

    // refCenter = 100 + 20 - 100 = 20；20 - 5 = 15
    expect(result.data).toEqual({ y: 15, side: "right" });
  });

  it("箭头不会超出浮层起点（padding 生效）", () => {
    const result = arrow({
      element: arrowElement(10, 10),
      padding: 6,
    }).fn(
      stateWithFloating({
        placement: "bottom",
        // 参照物在浮层左侧之外，算出来会是负数
        x: 500,
        y: 0,
        reference: rect(100, 0, 20, 40),
        floatingSize: { width: 200, height: 100 },
      }),
    );

    // 钳到 min = padding = 6
    expect(result.data).toEqual({ x: 6, side: "bottom" });
  });

  it("箭头不会超出浮层末端（padding 生效）", () => {
    const result = arrow({
      element: arrowElement(10, 10),
      padding: 6,
    }).fn(
      stateWithFloating({
        placement: "bottom",
        // 参照物远在浮层右侧之外
        x: 0,
        y: 0,
        reference: rect(900, 0, 100, 40),
        floatingSize: { width: 200, height: 100 },
      }),
    );

    // max = 200 - 10 - 6 = 184
    expect(result.data).toEqual({ x: 184, side: "bottom" });
  });

  it("默认 padding 为 4", () => {
    const result = arrow({ element: arrowElement(10, 10) }).fn(
      stateWithFloating({
        placement: "bottom",
        x: 500,
        y: 0,
        reference: rect(100, 0, 20, 40),
        floatingSize: { width: 200, height: 100 },
      }),
    );

    expect(result.data).toEqual({ x: 4, side: "bottom" });
  });

  it("使用 floating 的实时尺寸，而不是 state.rects.floating 的缓存值", () => {
    const floating = document.createElement("div");
    floating.getBoundingClientRect = () => asDOMRect(rect(0, 0, 400, 100));

    const state = middlewareState({
      x: 0,
      y: 0,
      placement: "bottom",
      reference: rect(900, 0, 100, 40),
      // 故意给一个过时的缓存尺寸
      floating: rect(0, 0, 200, 100),
    });
    state.elements.floating = floating;

    const result = arrow({ element: arrowElement(10, 10), padding: 4 }).fn(
      state,
    );

    // 用实时宽 400 算：max = 400 - 10 - 4 = 386
    expect(result.data).toEqual({ x: 386, side: "bottom" });
  });

  it("arrow 尺寸为 0 时按 0 计算（不产生 NaN）", () => {
    const result = arrow({ element: arrowElement(0, 0), padding: 0 }).fn(
      stateWithFloating({
        placement: "bottom",
        x: 0,
        y: 0,
        reference: rect(50, 0, 100, 40),
        floatingSize: { width: 200, height: 100 },
      }),
    );

    // refCenter = 50 + 50 - 0 = 100
    expect(result.data).toEqual({ x: 100, side: "bottom" });
  });

  it("浮层比 padding 还小时钳到 min，不产生负值", () => {
    const result = arrow({ element: arrowElement(10, 10), padding: 50 }).fn(
      stateWithFloating({
        placement: "bottom",
        x: 0,
        y: 0,
        reference: rect(455, 0, 100, 40),
        floatingSize: { width: 40, height: 100 },
      }),
    );

    expect(result.data).toEqual({ x: 50, side: "bottom" });
  });

  it("SVG 元素（只有 getBoundingClientRect）也能工作", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.getBoundingClientRect = () => asDOMRect(rect(0, 0, 8, 4));

    const result = arrow({ element: svg, padding: 0 }).fn(
      stateWithFloating({
        placement: "top",
        x: 0,
        y: 0,
        reference: rect(50, 0, 100, 40),
        floatingSize: { width: 200, height: 100 },
      }),
    );

    expect(result.data).toEqual({ x: 96, side: "top" });
  });

  it("不改变浮层坐标", () => {
    const result = arrow({ element: arrowElement(10, 10) }).fn(
      stateWithFloating({
        placement: "bottom",
        x: 10,
        y: 20,
        floatingSize: { width: 200, height: 100 },
      }),
    );

    expect(result.x).toBeUndefined();
    expect(result.y).toBeUndefined();
  });

  it("side 与 placement 的主方向一致（带对齐后缀）", () => {
    const result = arrow({ element: arrowElement(10, 10) }).fn(
      stateWithFloating({
        placement: "left-end",
        x: 0,
        y: 0,
        floatingSize: { width: 200, height: 100 },
      }),
    );

    expect(result.data).toEqual({ y: 15, side: "left" });
  });
});
