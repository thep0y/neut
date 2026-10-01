import { describe, expect, it } from "vitest";
import { clamp } from "~/utils/number";

describe("clamp", () => {
  it("值在区间内时原样返回", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("低于下界时返回下界", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it("高于上界时返回上界", () => {
    expect(clamp(42, 0, 10)).toBe(10);
  });

  it("缺省 min 时不限制下界", () => {
    expect(clamp(-100, undefined, 10)).toBe(-100);
  });

  it("缺省 max 时不限制上界", () => {
    expect(clamp(100, 0, undefined)).toBe(100);
  });

  it("min/max 都缺省时原样返回", () => {
    expect(clamp(7)).toBe(7);
  });

  it("min === max 时固定返回该值", () => {
    expect(clamp(3, 5, 5)).toBe(5);
    expect(clamp(9, 5, 5)).toBe(5);
  });

  it("恰好等于边界时返回边界值", () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("负数区间也能正确处理", () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(0, -10, -1)).toBe(-1);
    expect(clamp(-20, -10, -1)).toBe(-10);
  });

  it("小数边界不做取整", () => {
    expect(clamp(1.234, 1.2, 1.3)).toBe(1.234);
    expect(clamp(0.5, 1.2, 1.3)).toBe(1.2);
  });
});
