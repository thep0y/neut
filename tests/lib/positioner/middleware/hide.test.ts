import { describe, expect, it } from "vitest";
import {
  VIEWPORT,
  middlewareState,
  rect,
} from "~tests/lib/positioner/test-utils";
import { hide } from "~/lib/positioner/middleware/hide";

/** hide 默认走 referenceHidden 策略，读取 elements.reference 的 rect */
function stateWithReference(options: {
  referenceRect: ReturnType<typeof rect>;
  x?: number;
  y?: number;
  floating?: ReturnType<typeof rect>;
}) {
  const state = middlewareState({
    x: options.x ?? 0,
    y: options.y ?? 0,
    placement: "bottom",
    reference: options.referenceRect,
    floating: options.floating ?? rect(0, 0, 200, 100),
  });
  // hide 会通过 elements.reference 重新测 rect，这里让它返回测试给定的矩形
  state.elements.reference = {
    getBoundingClientRect: () => options.referenceRect,
  } as unknown as Element;
  return state;
}

describe("hide", () => {
  it("middleware 名为 hide", () => {
    expect(hide().name).toBe("hide");
  });

  it("参照物完全在视口内时 referenceHidden 为 false", () => {
    const result = hide({ boundary: VIEWPORT }).fn(
      stateWithReference({ referenceRect: rect(100, 100, 50, 20) }),
    );

    expect(result.data).toEqual({ referenceHidden: false });
  });

  it("参照物整体滚到视口上方之外时 referenceHidden 为 true", () => {
    const result = hide({ boundary: VIEWPORT }).fn(
      stateWithReference({ referenceRect: rect(100, -60, 50, 20) }),
    );

    expect(result.data).toEqual({ referenceHidden: true });
  });

  it("参照物整体滚到视口下方之外时 referenceHidden 为 true", () => {
    const result = hide({ boundary: VIEWPORT }).fn(
      stateWithReference({ referenceRect: rect(100, 850, 50, 20) }),
    );

    expect(result.data).toEqual({ referenceHidden: true });
  });

  it("参照物滚到视口左侧之外时 referenceHidden 为 true", () => {
    const result = hide({ boundary: VIEWPORT }).fn(
      stateWithReference({ referenceRect: rect(-60, 100, 50, 20) }),
    );

    expect(result.data).toEqual({ referenceHidden: true });
  });

  it("参照物滚到视口右侧之外时 referenceHidden 为 true", () => {
    const result = hide({ boundary: VIEWPORT }).fn(
      stateWithReference({ referenceRect: rect(1050, 100, 50, 20) }),
    );

    expect(result.data).toEqual({ referenceHidden: true });
  });

  it("参照物只露出一半时不算隐藏（仍能看到）", () => {
    const result = hide({ boundary: VIEWPORT }).fn(
      stateWithReference({ referenceRect: rect(100, -10, 50, 20) }),
    );

    // y=-10..10，仍有 10px 在视口内
    expect(result.data).toEqual({ referenceHidden: false });
  });

  it("参照物刚好贴住边界（宽度为 0 露出）算隐藏", () => {
    const result = hide({ boundary: VIEWPORT }).fn(
      stateWithReference({ referenceRect: rect(100, 0, 50, -20) }),
    );

    // y + height = -20 <= boundary.y => hidden
    expect(result.data).toEqual({ referenceHidden: true });
  });

  it("自定义边界按传入矩形判断", () => {
    const boundary = rect(100, 100, 200, 200);
    const result = hide({ boundary }).fn(
      stateWithReference({ referenceRect: rect(0, 0, 50, 20) }),
    );

    expect(result.data).toEqual({ referenceHidden: true });
  });

  it("默认不产出 escaped 字段", () => {
    const result = hide({ boundary: VIEWPORT }).fn(
      stateWithReference({ referenceRect: rect(100, 100, 50, 20) }),
    );

    expect((result.data as Record<string, unknown>).escaped).toBeUndefined();
  });

  it("strategy=escaped 时浮层完全离开边界则 escaped 为 true", () => {
    const result = hide({ boundary: VIEWPORT, strategy: "escaped" }).fn(
      stateWithReference({
        referenceRect: rect(100, 100, 50, 20),
        x: 1200,
        y: 100,
      }),
    );

    expect(result.data).toEqual({ escaped: true });
  });

  it("strategy=escaped 时浮层仍在边界内则 escaped 为 false", () => {
    const result = hide({ boundary: VIEWPORT, strategy: "escaped" }).fn(
      stateWithReference({
        referenceRect: rect(100, 100, 50, 20),
        x: 100,
        y: 100,
      }),
    );

    expect(result.data).toEqual({ escaped: false });
  });

  it("escaped 只产出 escaped，不产出 referenceHidden", () => {
    const result = hide({ boundary: VIEWPORT, strategy: "escaped" }).fn(
      stateWithReference({
        referenceRect: rect(100, 100, 50, 20),
        x: 100,
        y: 100,
      }),
    );

    expect(
      (result.data as Record<string, unknown>).referenceHidden,
    ).toBeUndefined();
  });

  it("不改变坐标", () => {
    const result = hide({ boundary: VIEWPORT }).fn(
      stateWithReference({
        referenceRect: rect(100, 100, 50, 20),
        x: 42,
        y: 24,
      }),
    );

    expect(result.x).toBeUndefined();
    expect(result.y).toBeUndefined();
  });

  it("传入自定义 boundary 时以 boundary 为准（padding 不参与）", () => {
    // 源码是 `options.boundary ?? getViewportBoundary(strategy, padding)`，
    // 传了 boundary 就短路，padding 只对默认视口边界生效。
    const result = hide({ boundary: VIEWPORT, padding: 50 }).fn(
      stateWithReference({ referenceRect: rect(20, 100, 10, 20) }),
    );

    // 用 VIEWPORT(0,0,1000,800) 判断：x=20..30 在视口内 => 不隐藏
    expect(result.data).toEqual({ referenceHidden: false });
  });

  it("缺省 boundary 时用视口边界，并受 padding 收缩", () => {
    // jsdom 的 documentElement.clientWidth/Height 默认为 0，
    // 显式设置后才能构造非退化边界。
    const originalW = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "clientWidth",
    );
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(document.documentElement, "clientHeight", {
      configurable: true,
      value: 800,
    });

    try {
      // 边界 0..1000 收缩 50 => 50..950；参照物 x=20..30 完全在左外侧
      const result = hide({ padding: 50 }).fn(
        stateWithReference({ referenceRect: rect(20, 100, 10, 20) }),
      );

      expect(result.data).toEqual({ referenceHidden: true });
    } finally {
      if (originalW) {
        Object.defineProperty(HTMLElement.prototype, "clientWidth", originalW);
      }
      Reflect.deleteProperty(document.documentElement, "clientWidth");
      Reflect.deleteProperty(document.documentElement, "clientHeight");
    }
  });
});
