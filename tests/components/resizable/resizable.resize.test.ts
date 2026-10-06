import { describe, expect, it } from "vitest";
import {
  distributeInitialSizes,
  EPSILON,
  type PairConstraints,
  pairBounds,
  resolvePairSize,
} from "~/components/resizable/resizable.resize";

/** 默认的「两个普通面板」约束：0–100，不可折叠 */
function constraints(
  overrides: Partial<PairConstraints> = {},
): PairConstraints {
  return {
    prevMin: 0,
    prevMax: 100,
    prevCollapsible: false,
    prevCollapsedSize: 0,
    prevFloor: 0,
    nextMin: 0,
    nextMax: 100,
    nextCollapsible: false,
    nextCollapsedSize: 0,
    nextFloor: 0,
    ...overrides,
  };
}

describe("EPSILON", () => {
  it("是 0.001（与上游语义对齐）", () => {
    expect(EPSILON).toBe(0.001);
  });
});

describe("pairBounds", () => {
  it("默认约束下界为 0、上界为 total", () => {
    expect(pairBounds(constraints(), 100)).toEqual({ lo: 0, hi: 100 });
  });

  it("prev 的 min 抬高下界", () => {
    expect(pairBounds(constraints({ prevMin: 20 }), 100)).toEqual({
      lo: 20,
      hi: 100,
    });
  });

  it("next 的 max 抬高下界（total - nextMax）", () => {
    // lo = max(0, 100-30) = 70
    expect(pairBounds(constraints({ nextMax: 30 }), 100)).toEqual({
      lo: 70,
      hi: 100,
    });
  });

  it("next 的 min 压低上界（total - nextMin）", () => {
    // hi = min(100, 100-40) = 60
    expect(pairBounds(constraints({ nextMin: 40 }), 100)).toEqual({
      lo: 0,
      hi: 60,
    });
  });

  it("prev 的 max 压低上界", () => {
    expect(pairBounds(constraints({ prevMax: 60 }), 100)).toEqual({
      lo: 0,
      hi: 60,
    });
  });

  it("多个约束同时生效时取更紧的一侧", () => {
    // lo = max(10, 100-80) = 20；hi = min(90, 100-15) = 85
    expect(
      pairBounds(
        constraints({ prevMin: 10, prevMax: 90, nextMin: 15, nextMax: 80 }),
        100,
      ),
    ).toEqual({ lo: 20, hi: 85 });
  });

  it("total 变化时边界随之移动", () => {
    // lo = max(0, 50-30) = 20；hi = min(100, 50-0) = 50
    expect(pairBounds(constraints({ nextMax: 30 }), 50)).toEqual({
      lo: 20,
      hi: 50,
    });
  });
});

describe("resolvePairSize - 基本夹取", () => {
  it("目标在区间内时原样返回", () => {
    expect(resolvePairSize(constraints(), 40, 100)).toBe(40);
  });

  it("目标低于下界时夹到下界", () => {
    expect(resolvePairSize(constraints({ prevMin: 20 }), 5, 100)).toBe(20);
  });

  it("目标高于上界时夹到上界", () => {
    expect(resolvePairSize(constraints({ prevMax: 70 }), 95, 100)).toBe(70);
  });

  it("两面板之和守恒（next = total - prev）", () => {
    const size = resolvePairSize(constraints(), 37.5, 100);

    expect(size + (100 - size)).toBe(100);
  });
});

describe("resolvePairSize - prev 折叠吸附", () => {
  const collapsible = constraints({
    prevCollapsible: true,
    prevCollapsedSize: 0,
    prevFloor: 20,
    prevMin: 0,
  });

  it("落在 (collapsed, floor) 且更靠近 collapsed 时吸附到 collapsed", () => {
    // 目标 5：距 collapsed(0) 5，距 floor(20) 15 → 吸到 0
    expect(resolvePairSize(collapsible, 5, 100)).toBe(0);
  });

  it("落在 (collapsed, floor) 且更靠近 floor 时吸附到 floor", () => {
    // 目标 15：距 collapsed 15，距 floor 5 → 吸到 20
    expect(resolvePairSize(collapsible, 15, 100)).toBe(20);
  });

  it("正好在中点时吸向 floor（严格小于才选 collapsed）", () => {
    // 目标 10：距两端都是 10 → 条件 (10 < 10) 为假 → 吸到 20
    expect(resolvePairSize(collapsible, 10, 100)).toBe(20);
  });

  it("恰好在 collapsed 上时保持不变（不触发吸附）", () => {
    expect(resolvePairSize(collapsible, 0, 100)).toBe(0);
  });

  it("恰好在 floor 上时保持不变", () => {
    expect(resolvePairSize(collapsible, 20, 100)).toBe(20);
  });

  it("大于 floor 时不受吸附影响", () => {
    expect(resolvePairSize(collapsible, 50, 100)).toBe(50);
  });

  it("不可折叠时不做吸附（停在目标值）", () => {
    const plain = constraints({ prevFloor: 20 });

    expect(resolvePairSize(plain, 5, 100)).toBe(5);
  });
});

describe("resolvePairSize - next 折叠吸附", () => {
  const collapsible = constraints({
    nextCollapsible: true,
    nextCollapsedSize: 0,
    nextFloor: 20,
    nextMin: 0,
  });

  it("next 侧更靠近 collapsed 时把空间让给 prev", () => {
    // 目标 prev=95 → next=5，距 collapsed 5 < 距 floor 15 → next 吸到 0，prev=100
    expect(resolvePairSize(collapsible, 95, 100)).toBe(100);
  });

  it("next 侧更靠近 floor 时把 next 抬到 floor", () => {
    // 目标 prev=85 → next=15，距 collapsed 15 > 距 floor 5 → next 吸到 20，prev=80
    expect(resolvePairSize(collapsible, 85, 100)).toBe(80);
  });

  it("next 恰好等于 floor 时不变", () => {
    expect(resolvePairSize(collapsible, 80, 100)).toBe(80);
  });

  it("next 侧超出 floor 时不受吸附影响", () => {
    expect(resolvePairSize(collapsible, 50, 100)).toBe(50);
  });
});

describe("resolvePairSize - 两端同时可折叠", () => {
  const both = constraints({
    prevCollapsible: true,
    prevCollapsedSize: 0,
    prevFloor: 20,
    nextCollapsible: true,
    nextCollapsedSize: 0,
    nextFloor: 20,
  });

  it("两侧都接近折叠时，prev 优先吸附", () => {
    // prev 目标 5 → prev 吸到 0；随后 next=100 不触发
    expect(resolvePairSize(both, 5, 100)).toBe(0);
  });

  it("prev 正常、next 接近折叠时只有 next 吸附", () => {
    expect(resolvePairSize(both, 95, 100)).toBe(100);
  });

  it("两侧都在安全区时原样返回", () => {
    expect(resolvePairSize(both, 50, 100)).toBe(50);
  });
});

describe("resolvePairSize - 吸附后重新夹取", () => {
  it("吸附结果越出上界时被夹回（min 与 max 冲突时优先约束）", () => {
    // prevMax=10 会把 hi 压到 10；prev 吸附到 floor=20 后需夹回 10
    const c = constraints({
      prevCollapsible: true,
      prevCollapsedSize: 0,
      prevFloor: 20,
      prevMax: 10,
      nextMin: 90,
    });

    expect(resolvePairSize(c, 15, 100)).toBe(10);
  });
});

describe("distributeInitialSizes", () => {
  it("全部有 defaultSize 时原样返回", () => {
    expect(distributeInitialSizes(["a", "b"], undefined, [30, 70])).toEqual([
      30, 70,
    ]);
  });

  it("没有尺寸的面板平分剩余空间", () => {
    // 已用 40，剩余 60，2 个未指定 → 各 30
    expect(
      distributeInitialSizes(["a", "b", "c"], undefined, [
        40,
        undefined,
        undefined,
      ]),
    ).toEqual([40, 30, 30]);
  });

  it("全部未指定时平分 100", () => {
    expect(
      distributeInitialSizes(["a", "b"], undefined, [undefined, undefined]),
    ).toEqual([50, 50]);
  });

  it("saved 优先于 defaultSize", () => {
    expect(
      distributeInitialSizes(["a", "b"], { a: 80, b: 20 }, [10, 90]),
    ).toEqual([80, 20]);
  });

  it("saved 里缺某个 id 时回退到 defaultSize", () => {
    expect(distributeInitialSizes(["a", "b"], { a: 80 }, [10, 90])).toEqual([
      80, 90,
    ]);
  });

  it("已用尺寸超过 100 时剩余为 0（不会产生负数）", () => {
    expect(
      distributeInitialSizes(["a", "b"], undefined, [150, undefined]),
    ).toEqual([150, 0]);
  });

  it("空列表返回空数组", () => {
    expect(distributeInitialSizes([], undefined, [])).toEqual([]);
  });

  it("saved 里显式的 0 被当作有效值", () => {
    expect(
      distributeInitialSizes(["a", "b"], { a: 0, b: 100 }, [50, 50]),
    ).toEqual([0, 100]);
  });

  it("三个面板只有中间指定尺寸时，两侧平分剩余", () => {
    // 已用 40，剩余 60，2 个未指定 → 各 30
    expect(
      distributeInitialSizes(["a", "b", "c"], undefined, [
        undefined,
        40,
        undefined,
      ]),
    ).toEqual([30, 40, 30]);
  });
});
