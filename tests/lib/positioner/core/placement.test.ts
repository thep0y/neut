import { describe, expect, it } from "vitest";
import {
  ALL_PLACEMENTS,
  computeCoordsFromPlacement,
  getAlignment,
  getOppositeAlignmentPlacement,
  getOppositePlacement,
  getOppositeSide,
  getSide,
  isVerticalSide,
} from "~/lib/positioner/core/placement";
import { rect } from "~tests/lib/positioner/test-utils";

describe("getSide", () => {
  it("从 placement 中取出主方向", () => {
    expect(getSide("top")).toBe("top");
    expect(getSide("left-end")).toBe("left");
  });

  it("带对齐后缀时只返回主方向", () => {
    expect(getSide("bottom-start")).toBe("bottom");
    expect(getSide("right-end")).toBe("right");
  });
});

describe("getAlignment", () => {
  it("无对齐后缀时返回 undefined", () => {
    expect(getAlignment("top")).toBeUndefined();
    expect(getAlignment("right")).toBeUndefined();
  });

  it("带对齐后缀时返回 start / end", () => {
    expect(getAlignment("top-start")).toBe("start");
    expect(getAlignment("bottom-end")).toBe("end");
  });
});

describe("isVerticalSide", () => {
  it("top / bottom 属于竖直方向", () => {
    expect(isVerticalSide("top")).toBe(true);
    expect(isVerticalSide("bottom")).toBe(true);
  });

  it("left / right 属于水平方向", () => {
    expect(isVerticalSide("left")).toBe(false);
    expect(isVerticalSide("right")).toBe(false);
  });
});

describe("getOppositeSide", () => {
  it("每个方向都映射到正对面", () => {
    expect(getOppositeSide("top")).toBe("bottom");
    expect(getOppositeSide("bottom")).toBe("top");
    expect(getOppositeSide("left")).toBe("right");
    expect(getOppositeSide("right")).toBe("left");
  });
});

describe("getOppositePlacement", () => {
  it("保留对齐后缀，只翻转主方向", () => {
    expect(getOppositePlacement("bottom-start")).toBe("top-start");
    expect(getOppositePlacement("top-end")).toBe("bottom-end");
    expect(getOppositePlacement("left-start")).toBe("right-start");
    expect(getOppositePlacement("right-end")).toBe("left-end");
  });

  it("无对齐后缀时翻转后也不带后缀", () => {
    expect(getOppositePlacement("bottom")).toBe("top");
    expect(getOppositePlacement("right")).toBe("left");
  });
});

describe("getOppositeAlignmentPlacement", () => {
  it("保持主方向，start 与 end 互换", () => {
    expect(getOppositeAlignmentPlacement("top-start")).toBe("top-end");
    expect(getOppositeAlignmentPlacement("bottom-end")).toBe("bottom-start");
  });

  it("没有对齐后缀时原样返回", () => {
    expect(getOppositeAlignmentPlacement("top")).toBe("top");
    expect(getOppositeAlignmentPlacement("left")).toBe("left");
  });
});

describe("computeCoordsFromPlacement", () => {
  const rects = {
    reference: rect(100, 100, 50, 20),
    floating: rect(0, 0, 200, 80),
  };

  it("bottom：浮层在参照物下方，水平居中", () => {
    expect(computeCoordsFromPlacement(rects, "bottom")).toEqual({
      // 居中：100 + 50/2 - 200/2 = 25
      x: 25,
      y: 120,
    });
  });

  it("top：浮层在参照物上方，水平居中", () => {
    expect(computeCoordsFromPlacement(rects, "top")).toEqual({
      x: 25,
      y: 20,
    });
  });

  it("right：浮层在参照物右侧，垂直居中", () => {
    expect(computeCoordsFromPlacement(rects, "right")).toEqual({
      x: 150,
      // 100 + 20/2 - 80/2 = 70
      y: 70,
    });
  });

  it("left：浮层在参照物左侧，垂直居中", () => {
    expect(computeCoordsFromPlacement(rects, "left")).toEqual({
      x: -100,
      y: 70,
    });
  });

  it("竖直方向的 start 对齐到参照物左边缘", () => {
    expect(computeCoordsFromPlacement(rects, "bottom-start")).toEqual({
      x: 100,
      y: 120,
    });
  });

  it("竖直方向的 end 对齐到参照物右边缘", () => {
    expect(computeCoordsFromPlacement(rects, "bottom-end")).toEqual({
      // 100 + 50 - 200 = -50
      x: -50,
      y: 120,
    });
  });

  it("水平方向的 start 对齐到参照物上边缘", () => {
    expect(computeCoordsFromPlacement(rects, "right-start")).toEqual({
      x: 150,
      y: 100,
    });
  });

  it("水平方向的 end 对齐到参照物下边缘", () => {
    expect(computeCoordsFromPlacement(rects, "right-end")).toEqual({
      x: 150,
      // 100 + 20 - 80 = 40
      y: 40,
    });
  });
});

describe("ALL_PLACEMENTS", () => {
  it("包含 4 个方向 × 3 种对齐的 12 种组合", () => {
    expect(ALL_PLACEMENTS).toHaveLength(12);
  });

  it("每个方向都有无对齐、start、end 三种", () => {
    for (const side of ["top", "right", "bottom", "left"] as const) {
      expect(ALL_PLACEMENTS).toContain(side);
      expect(ALL_PLACEMENTS).toContain(`${side}-start`);
      expect(ALL_PLACEMENTS).toContain(`${side}-end`);
    }
  });

  it("没有重复项", () => {
    expect(new Set(ALL_PLACEMENTS).size).toBe(ALL_PLACEMENTS.length);
  });
});
