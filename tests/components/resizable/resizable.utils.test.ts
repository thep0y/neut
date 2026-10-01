import { describe, expect, it } from "vitest";
import {
  normalizeSizes,
  parseSize,
  roundPercent,
} from "~/components/resizable/resizable.utils";

describe("parseSize", () => {
  it("undefined 返回 fallback", () => {
    expect(parseSize(undefined, 50)).toBe(50);
  });

  it("数字原样返回", () => {
    expect(parseSize(30, 50)).toBe(30);
  });

  it("数字字符串按数值解析", () => {
    expect(parseSize("25", 50)).toBe(25);
  });

  it("带百分号的字符串按数值解析", () => {
    expect(parseSize("25%", 50)).toBe(25);
  });

  it("前后空白被忽略", () => {
    expect(parseSize("  40  ", 50)).toBe(40);
  });

  it("NaN 返回 fallback", () => {
    expect(parseSize(Number.NaN, 50)).toBe(50);
  });

  it("Infinity 返回 fallback", () => {
    expect(parseSize(Number.POSITIVE_INFINITY, 50)).toBe(50);
  });

  it("无法解析的文本返回 fallback", () => {
    expect(parseSize("abc", 50)).toBe(50);
    expect(parseSize("px", 50)).toBe(50);
  });

  it("负数可解析（由调用方决定是否合法）", () => {
    expect(parseSize("-10", 50)).toBe(-10);
  });

  it("小数可解析", () => {
    expect(parseSize("12.5", 50)).toBe(12.5);
  });

  it("0 是合法值，不会被 fallback 顶替", () => {
    expect(parseSize(0, 50)).toBe(0);
    expect(parseSize("0", 50)).toBe(0);
  });
});

describe("roundPercent", () => {
  it("保留两位小数", () => {
    expect(roundPercent(33.333333)).toBe(33.33);
  });

  it("整数原样返回", () => {
    expect(roundPercent(25)).toBe(25);
  });

  it("四舍五入到两位（注意浮点乘法精度）", () => {
    // 1.005 * 100 === 100.49999999999999，因此结果是 1 而不是 1.01；
    // 这里锁定真实行为，避免后来者误以为它做了 Decimal 级别的精确舍入。
    expect(roundPercent(1.005)).toBe(1);
    // 能安全表示的值仍是正常的四舍五入
    expect(roundPercent(2.345)).toBe(2.35);
    expect(roundPercent(33.333333)).toBe(33.33);
  });

  it("负数同样处理", () => {
    expect(roundPercent(-33.333)).toBe(-33.33);
  });

  it("0 返回 0", () => {
    expect(roundPercent(0)).toBe(0);
  });
});

describe("normalizeSizes", () => {
  const noBounds = (count: number) =>
    Array.from({ length: count }, () => ({ min: 0, max: 100 }));

  it("空数组返回空数组", () => {
    expect(normalizeSizes([], [])).toEqual([]);
  });

  it("总和为 100 时原样返回", () => {
    expect(normalizeSizes([30, 70], noBounds(2))).toEqual([30, 70]);
  });

  it("按权重归一化到总和 100", () => {
    expect(normalizeSizes([1, 3], noBounds(2))).toEqual([25, 75]);
  });

  it("三个面板按比例归一化", () => {
    const result = normalizeSizes([10, 20, 30], noBounds(3));
    expect(result[0]).toBeCloseTo(16.67, 1);
    expect(result[1]).toBeCloseTo(33.33, 1);
    expect(result[2]).toBeCloseTo(50, 1);
  });

  it("总和为 0 时均分", () => {
    expect(normalizeSizes([0, 0, 0], noBounds(3))).toEqual([
      100 / 3,
      100 / 3,
      100 / 3,
    ]);
  });

  it("全负数（总和 <= 0）时回退为均分", () => {
    const bounds = [
      { min: -10, max: 100 },
      { min: -10, max: 100 },
    ];
    expect(normalizeSizes([-1, -1], bounds)).toEqual([50, 50]);
  });

  it("归一化后超过 max 的项被固定为 max", () => {
    // 1:1 => 各 50，但第一项 max=20
    const result = normalizeSizes(
      [1, 1],
      [
        { min: 0, max: 20 },
        { min: 0, max: 100 },
      ],
    );

    expect(result[0]).toBe(20);
    expect(result[1]).toBe(80);
  });

  it("一个项触底 min 时另一个项吃掉剩余空间", () => {
    // 1:99 归一化 => 1 : 99，第一项低于 min=40 => 抬到 40，第二项得 60。
    const result = normalizeSizes(
      [1, 99],
      [
        { min: 40, max: 100 },
        { min: 0, max: 100 },
      ],
    );

    expect(result[0]).toBe(40);
    // 60.00000000000001：浮点累加的正常结果，用近似断言
    expect(result[1]).toBeCloseTo(60, 6);
  });

  it("min 只是下限：不会把已经高于 min 的项拉到 min", () => {
    // 归一化后第二项 98.96 已经 >= min=95，因此不做任何钳制。
    const result = normalizeSizes(
      [1, 9],
      [
        { min: 0, max: 100 },
        { min: 95, max: 100 },
      ],
    );

    expect(result[0]).toBeCloseTo(1.0417, 3);
    expect(result[1]).toBeCloseTo(98.9583, 3);
  });

  it("结果总和始终为 100（在可行范围内）", () => {
    const result = normalizeSizes([3, 1, 6], noBounds(3));
    const sum = result.reduce((a, v) => a + v, 0);
    expect(sum).toBeCloseTo(100, 10);
  });

  it("边界收紧后总和仍为 100", () => {
    const result = normalizeSizes(
      [50, 50],
      [
        { min: 0, max: 70 },
        { min: 30, max: 100 },
      ],
    );
    const sum = result.reduce((a, v) => a + v, 0);
    expect(sum).toBeCloseTo(100, 10);
  });

  it("输入本身越界时先被 clamp 再归一化", () => {
    const result = normalizeSizes(
      [200, 50],
      [
        { min: 0, max: 60 },
        { min: 0, max: 100 },
      ],
    );

    // 200 被 clamp 到 60 => 60:50 => 54.55 : 45.45
    expect(result[0]).toBeCloseTo(54.55, 1);
    expect(result[1]).toBeCloseTo(45.45, 1);
  });

  it("全部项都被 max 钉住时按钉住值返回（总和可以 < 100，边界不可行）", () => {
    // 1:1 归一化 => 各 50，但两边 max 都是 30 => 都被钉到 30。
    // 这是**边界不可行**的情形：没有解能同时满足所有 max 且总和为 100，
    // 实现选择"尊重边界"而不是"硬凑 100"。
    const result = normalizeSizes(
      [1, 1],
      [
        { min: 0, max: 30 },
        { min: 0, max: 30 },
      ],
    );

    expect(result).toEqual([30, 30]);
  });

  it("freeSum 为 0 时剩余项均分（min 都为 0 的退化情形）", () => {
    // 第一项被 clamp 到 max=100，第二项为 0 => 归一化后 freeSum 为 0
    const result = normalizeSizes(
      [100, 0],
      [
        { min: 0, max: 100 },
        { min: 0, max: 100 },
      ],
    );

    expect(result.reduce((a, v) => a + v, 0)).toBeCloseTo(100, 10);
  });

  it("单个面板归一化后为 100", () => {
    expect(normalizeSizes([42], noBounds(1))).toEqual([100]);
  });

  it("free 项权重和为 0 时改为均分剩余空间（不再按比例）", () => {
    // 原始权重 [0, 0] 归一化后是 [0, 100]；第二项超过 max=50 被钉在 50，
    // 于是只剩第一项是 free，且它的权重和为 0，无法按比例分配 ——
    // 实现改为把剩余空间（100 - 50 = 50）均分给 free 项，即第一项拿到 50。
    const result = normalizeSizes(
      [0, 0],
      [
        { min: 0, max: 50 },
        { min: 0.001, max: 50 },
      ],
    );

    expect(result).toEqual([50, 50]);
  });

  it("迭代收敛：min/max 收紧后仍满足所有边界", () => {
    const bounds = [
      { min: 20, max: 40 },
      { min: 30, max: 50 },
      { min: 10, max: 100 },
    ];
    const result = normalizeSizes([1, 1, 1], bounds);

    result.forEach((value, index) => {
      expect(value).toBeGreaterThanOrEqual(bounds[index].min);
      expect(value).toBeLessThanOrEqual(bounds[index].max);
    });
    expect(result.reduce((a, v) => a + v, 0)).toBeCloseTo(100, 6);
  });

  it("不修改传入的数组", () => {
    const raw = [1, 2, 3];
    normalizeSizes(raw, noBounds(3));

    expect(raw).toEqual([1, 2, 3]);
  });
});
