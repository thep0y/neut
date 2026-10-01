import { describe, expect, it } from "vitest";
import {
  VIEWPORT,
  middlewareState,
  rect,
} from "~tests/lib/positioner/test-utils";
import { shift } from "~/lib/positioner/middleware/shift";

describe("shift", () => {
  it("middleware 名为 shift", () => {
    expect(shift().name).toBe("shift");
  });

  it("完全在边界内时坐标不变", () => {
    const result = shift({ boundary: VIEWPORT }).fn(
      middlewareState({
        x: 100,
        y: 100,
        placement: "bottom",
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result.x).toBe(100);
    expect(result.y).toBe(100);
  });

  it("crossAxis 左溢出时贴住左边界", () => {
    const result = shift({ boundary: VIEWPORT }).fn(
      middlewareState({
        x: -50,
        y: 100,
        placement: "bottom",
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result.x).toBe(0);
  });

  it("crossAxis 右溢出时贴住右边界的最大可用位置", () => {
    const result = shift({ boundary: VIEWPORT }).fn(
      middlewareState({
        // 950 + 200 = 1150 > 1000
        x: 950,
        y: 100,
        placement: "bottom",
        floating: rect(0, 0, 200, 100),
      }),
    );

    // 1000 - 200 = 800
    expect(result.x).toBe(800);
  });

  it("mainAxis 下溢出时贴住下边界", () => {
    const result = shift({ boundary: VIEWPORT }).fn(
      middlewareState({
        x: 100,
        // 760 + 100 = 860 > 800
        y: 760,
        placement: "bottom",
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result.y).toBe(700);
  });

  it("浮层比边界还宽时不会产生负坐标（钳到 min）", () => {
    const result = shift({ boundary: VIEWPORT }).fn(
      middlewareState({
        x: 10,
        y: 10,
        placement: "bottom",
        floating: rect(0, 0, 2000, 100),
      }),
    );

    // maxX = 1000 - 2000 = -1000，Math.max(minX, maxX) 取 0，避免负坐标
    expect(result.x).toBe(0);
  });

  it("浮层比边界还高时同样钳到上边界", () => {
    const result = shift({ boundary: VIEWPORT }).fn(
      middlewareState({
        x: 10,
        y: 10,
        placement: "bottom",
        floating: rect(0, 0, 200, 5000),
      }),
    );

    expect(result.y).toBe(0);
  });

  it("crossAxis=false 时不限制交叉轴", () => {
    const result = shift({ boundary: VIEWPORT, crossAxis: false }).fn(
      middlewareState({
        x: -50,
        y: 100,
        placement: "bottom",
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result.x).toBe(-50);
  });

  it("mainAxis=false 时不限制主轴", () => {
    const result = shift({ boundary: VIEWPORT, mainAxis: false }).fn(
      middlewareState({
        x: 100,
        y: 900,
        placement: "bottom",
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result.y).toBe(900);
  });

  it("返回 data 记录实际平移量", () => {
    const result = shift({ boundary: VIEWPORT }).fn(
      middlewareState({
        x: -50,
        y: -30,
        placement: "bottom",
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result.data).toEqual({ x: 50, y: 30 });
  });

  it("未平移时 data 为 0 增量", () => {
    const result = shift({ boundary: VIEWPORT }).fn(
      middlewareState({
        x: 100,
        y: 100,
        placement: "bottom",
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result.data).toEqual({ x: 0, y: 0 });
  });

  it("自定义边界按传入的矩形裁剪", () => {
    const boundary = rect(50, 50, 200, 200);
    const result = shift({ boundary }).fn(
      middlewareState({
        x: 0,
        y: 100,
        placement: "bottom",
        floating: rect(0, 0, 100, 50),
      }),
    );

    expect(result.x).toBe(50);
  });

  it("缺省 boundary 时用视口边界（padding 参与收缩）", () => {
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(document.documentElement, "clientHeight", {
      configurable: true,
      value: 800,
    });

    try {
      const result = shift({ padding: 20 }).fn(
        middlewareState({
          x: 5,
          y: 100,
          placement: "bottom",
          floating: rect(0, 0, 200, 100),
        }),
      );

      // 有效左边界 20 => 从 5 被推回 20
      expect(result.x).toBe(20);
    } finally {
      Reflect.deleteProperty(document.documentElement, "clientWidth");
      Reflect.deleteProperty(document.documentElement, "clientHeight");
    }
  });
});
