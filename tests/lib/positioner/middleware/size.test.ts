import { describe, expect, it, vi } from "vitest";
import {
  VIEWPORT,
  middlewareState,
  rect,
} from "~tests/lib/positioner/test-utils";
import { size } from "~/lib/positioner/middleware/size";

describe("size", () => {
  it("middleware 名为 size", () => {
    expect(size().name).toBe("size");
  });

  it("从浮层左上角算到边界右下角的可用空间", () => {
    const result = size({ boundary: VIEWPORT }).fn(
      middlewareState({
        x: 300,
        y: 200,
        placement: "bottom",
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result.data).toEqual({
      availableWidth: 700, // 1000 - 300
      availableHeight: 600, // 800 - 200
    });
  });

  it("坐标在边界外时可用空间为负（交给调用方决定是否钳制）", () => {
    const result = size({ boundary: VIEWPORT }).fn(
      middlewareState({
        x: 1200,
        y: 900,
        placement: "bottom",
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result.data).toEqual({
      availableWidth: -200,
      availableHeight: -100,
    });
  });

  it("apply 回调收到可用空间与完整 state", () => {
    const apply = vi.fn();
    const state = middlewareState({
      x: 100,
      y: 100,
      placement: "bottom",
      floating: rect(0, 0, 200, 100),
    });

    size({ boundary: VIEWPORT, apply }).fn(state);

    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith(
      { availableWidth: 900, availableHeight: 700 },
      state,
    );
  });

  it("未传 apply 时不报错", () => {
    expect(() =>
      size({ boundary: VIEWPORT }).fn(
        middlewareState({ x: 0, y: 0, placement: "bottom" }),
      ),
    ).not.toThrow();
  });

  it("不改变坐标", () => {
    const result = size({ boundary: VIEWPORT }).fn(
      middlewareState({ x: 100, y: 100, placement: "bottom" }),
    );

    expect(result.x).toBeUndefined();
    expect(result.y).toBeUndefined();
  });

  it("自定义边界生效", () => {
    const result = size({ boundary: rect(50, 60, 200, 300) }).fn(
      middlewareState({
        x: 100,
        y: 100,
        placement: "bottom",
        floating: rect(0, 0, 50, 20),
      }),
    );

    expect(result.data).toEqual({
      availableWidth: 150, // 50+200-100
      availableHeight: 260, // 60+300-100
    });
  });

  it("缺省边界时用视口尺寸并受 padding 收缩", () => {
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(document.documentElement, "clientHeight", {
      configurable: true,
      value: 800,
    });

    try {
      const result = size({ padding: 20 }).fn(
        middlewareState({
          x: 100,
          y: 100,
          placement: "bottom",
          floating: rect(0, 0, 50, 20),
        }),
      );

      // 边界 20..980 / 20..780 => 可用宽 880、可用高 680
      expect(result.data).toEqual({
        availableWidth: 880,
        availableHeight: 680,
      });
    } finally {
      Reflect.deleteProperty(document.documentElement, "clientWidth");
      Reflect.deleteProperty(document.documentElement, "clientHeight");
    }
  });
});
