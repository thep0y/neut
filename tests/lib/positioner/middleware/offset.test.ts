import { describe, expect, it } from "vitest";
import { middlewareState } from "~tests/lib/positioner/test-utils";
import { offset } from "~/lib/positioner/middleware/offset";

/** 直接取 middleware 返回的坐标，默认行为是"相对当前坐标的增量" */
function run(
  result: ReturnType<ReturnType<typeof offset>["fn"]>,
  base: { x: number; y: number },
) {
  return { x: result.x ?? base.x, y: result.y ?? base.y };
}

describe("offset", () => {
  const base = { x: 100, y: 100 };

  it("默认不产生偏移", () => {
    const result = offset().fn(
      middlewareState({ ...base, placement: "bottom" }),
    );

    expect(run(result, base)).toEqual({ x: 100, y: 100 });
  });

  it("bottom：正值让浮层向下远离参照物", () => {
    const result = offset(8).fn(
      middlewareState({ ...base, placement: "bottom" }),
    );

    expect(run(result, base)).toEqual({ x: 100, y: 108 });
  });

  it("top：正值让浮层向上远离参照物（负方向）", () => {
    const result = offset(8).fn(middlewareState({ ...base, placement: "top" }));

    expect(run(result, base)).toEqual({ x: 100, y: 92 });
  });

  it("right：正值让浮层向右远离参照物", () => {
    const result = offset(8).fn(
      middlewareState({ ...base, placement: "right" }),
    );

    expect(run(result, base)).toEqual({ x: 108, y: 100 });
  });

  it("left：正值让浮层向左远离参照物（负方向）", () => {
    const result = offset(8).fn(
      middlewareState({ ...base, placement: "left" }),
    );

    expect(run(result, base)).toEqual({ x: 92, y: 100 });
  });

  it("带对齐后缀时取主方向判断正负", () => {
    const result = offset(8).fn(
      middlewareState({ ...base, placement: "bottom-start" }),
    );

    expect(run(result, base)).toEqual({ x: 100, y: 108 });
  });

  it("crossAxis 在竖直 placement 下沿 x 平移", () => {
    const result = offset({ mainAxis: 8, crossAxis: 20 }).fn(
      middlewareState({ ...base, placement: "bottom" }),
    );

    expect(run(result, base)).toEqual({ x: 120, y: 108 });
  });

  it("crossAxis 在水平 placement 下沿 y 平移", () => {
    const result = offset({ mainAxis: 8, crossAxis: 20 }).fn(
      middlewareState({ ...base, placement: "right" }),
    );

    expect(run(result, base)).toEqual({ x: 108, y: 120 });
  });

  it("crossAxis 可为负", () => {
    const result = offset({ crossAxis: -15 }).fn(
      middlewareState({ ...base, placement: "bottom" }),
    );

    expect(run(result, base)).toEqual({ x: 85, y: 100 });
  });

  it("只给 mainAxis 时 crossAxis 默认为 0", () => {
    const result = offset({ mainAxis: 5 }).fn(
      middlewareState({ ...base, placement: "bottom" }),
    );

    expect(run(result, base)).toEqual({ x: 100, y: 105 });
  });

  it("只给 crossAxis 时 mainAxis 默认为 0", () => {
    const result = offset({ crossAxis: 5 }).fn(
      middlewareState({ ...base, placement: "bottom" }),
    );

    expect(run(result, base)).toEqual({ x: 105, y: 100 });
  });

  it("middleware 名为 offset", () => {
    expect(offset().name).toBe("offset");
  });
});
