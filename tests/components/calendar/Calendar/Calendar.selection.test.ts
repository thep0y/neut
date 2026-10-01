import { describe, expect, it } from "vitest";
import {
  isDateSelected,
  isRangeEnd,
  isRangeMiddle,
  isRangeStart,
  nextSelected,
} from "~/components/calendar/Calendar/Calendar.selection";

/** 便于断言的固定日期 */
const D = (day: number, month = 5) => new Date(2024, month, day);

describe("isRangeStart", () => {
  it("与 from 同一天时为 true", () => {
    expect(isRangeStart({ from: D(10), to: D(20) }, D(10))).toBe(true);
  });

  it("不是 from 时为 false", () => {
    expect(isRangeStart({ from: D(10), to: D(20) }, D(11))).toBe(false);
  });

  it("没有 from 时为 false", () => {
    expect(isRangeStart({ to: D(20) }, D(20))).toBe(false);
  });

  it("选中值是 Date / 数组 / undefined 时为 false（非区间模式）", () => {
    expect(isRangeStart(D(10), D(10))).toBe(false);
    expect(isRangeStart([D(10)], D(10))).toBe(false);
    expect(isRangeStart(undefined, D(10))).toBe(false);
  });

  it("忽略时间部分（同一天不同时刻也算）", () => {
    expect(isRangeStart({ from: new Date(2024, 5, 10, 23, 59) }, D(10))).toBe(
      true,
    );
  });
});

describe("isRangeEnd", () => {
  it("与 to 同一天时为 true", () => {
    expect(isRangeEnd({ from: D(10), to: D(20) }, D(20))).toBe(true);
  });

  it("没有 to 时为 false", () => {
    expect(isRangeEnd({ from: D(10) }, D(10))).toBe(false);
  });

  it("非区间选中值时为 false", () => {
    expect(isRangeEnd(D(20), D(20))).toBe(false);
  });
});

describe("isRangeMiddle", () => {
  it("严格落在两端之间时为 true", () => {
    expect(isRangeMiddle({ from: D(10), to: D(20) }, D(15))).toBe(true);
  });

  it("两端本身不算 middle", () => {
    expect(isRangeMiddle({ from: D(10), to: D(20) }, D(10))).toBe(false);
    expect(isRangeMiddle({ from: D(10), to: D(20) }, D(20))).toBe(false);
  });

  it("区间之外为 false", () => {
    expect(isRangeMiddle({ from: D(10), to: D(20) }, D(21))).toBe(false);
  });

  it("缺 from 或 to 时为 false（区间未完整）", () => {
    expect(isRangeMiddle({ from: D(10) }, D(15))).toBe(false);
    expect(isRangeMiddle({ to: D(20) }, D(15))).toBe(false);
  });
});

describe("isDateSelected - single", () => {
  it("与选中日期同一天时为 true", () => {
    expect(isDateSelected("single", D(10), D(10))).toBe(true);
  });

  it("不同天时为 false", () => {
    expect(isDateSelected("single", D(10), D(11))).toBe(false);
  });

  it("选中值是 undefined / 数组 / 区间时为 false", () => {
    expect(isDateSelected("single", undefined, D(10))).toBe(false);
    expect(isDateSelected("single", [D(10)], D(10))).toBe(false);
    expect(isDateSelected("single", { from: D(10) }, D(10))).toBe(false);
  });
});

describe("isDateSelected - multiple", () => {
  it("在数组中时为 true", () => {
    expect(isDateSelected("multiple", [D(10), D(12)], D(12))).toBe(true);
  });

  it("不在数组中时为 false", () => {
    expect(isDateSelected("multiple", [D(10)], D(12))).toBe(false);
  });

  it("空数组 / 非数组选中值时均为 false", () => {
    expect(isDateSelected("multiple", [], D(10))).toBe(false);
    expect(isDateSelected("multiple", D(10), D(10))).toBe(false);
    expect(isDateSelected("multiple", undefined, D(10))).toBe(false);
  });
});

describe("isDateSelected - range", () => {
  const range = { from: D(10), to: D(20) };

  it("起点 / 终点 / 区间内部都为 true", () => {
    expect(isDateSelected("range", range, D(10))).toBe(true);
    expect(isDateSelected("range", range, D(20))).toBe(true);
    expect(isDateSelected("range", range, D(15))).toBe(true);
  });

  it("区间之外为 false", () => {
    expect(isDateSelected("range", range, D(21))).toBe(false);
    expect(isDateSelected("range", range, D(9))).toBe(false);
  });

  it("只有 from 时仅起点为 true", () => {
    expect(isDateSelected("range", { from: D(10) }, D(10))).toBe(true);
    expect(isDateSelected("range", { from: D(10) }, D(11))).toBe(false);
  });

  it("只有 to 时仅终点为 true", () => {
    expect(isDateSelected("range", { to: D(20) }, D(20))).toBe(true);
    expect(isDateSelected("range", { to: D(20) }, D(19))).toBe(false);
  });

  it("选中值为 undefined / Date / 数组时均为 false", () => {
    expect(isDateSelected("range", undefined, D(10))).toBe(false);
    expect(isDateSelected("range", D(10), D(10))).toBe(false);
    expect(isDateSelected("range", [D(10)], D(10))).toBe(false);
  });

  it("from 与 to 为同一天时该天仍算选中", () => {
    expect(isDateSelected("range", { from: D(10), to: D(10) }, D(10))).toBe(
      true,
    );
  });
});

describe("nextSelected - single", () => {
  it("未选中时选中该天", () => {
    expect(nextSelected("single", undefined, D(10))).toEqual(D(10));
  });

  it("点击已选中的同一天时取消选中（返回 undefined）", () => {
    expect(nextSelected("single", D(10), D(10))).toBeUndefined();
  });

  it("点击另一天时改为新日期", () => {
    expect(nextSelected("single", D(10), D(12))).toEqual(D(12));
  });

  it("忽略选中值的旧类型（非 Date 时按未选中处理）", () => {
    expect(nextSelected("single", [D(10)], D(12))).toEqual(D(12));
    expect(nextSelected("single", { from: D(10) }, D(12))).toEqual(D(12));
  });
});

describe("nextSelected - multiple", () => {
  it("从空开始追加", () => {
    expect(nextSelected("multiple", undefined, D(10))).toEqual([D(10)]);
  });

  it("追加到已有数组末尾（保持原顺序）", () => {
    expect(nextSelected("multiple", [D(9), D(11)], D(10))).toEqual([
      D(9),
      D(11),
      D(10),
    ]);
  });

  it("点击已存在的日期时移除它", () => {
    expect(nextSelected("multiple", [D(9), D(10), D(11)], D(10))).toEqual([
      D(9),
      D(11),
    ]);
  });

  it("移除后数组为空时返回空数组（不是 undefined）", () => {
    expect(nextSelected("multiple", [D(10)], D(10))).toEqual([]);
  });

  it("不修改传入的数组（不可变）", () => {
    const current = [D(9), D(10)];
    nextSelected("multiple", current, D(10));

    expect(current).toEqual([D(9), D(10)]);
  });

  it("选中值不是数组时按空数组处理", () => {
    expect(nextSelected("multiple", D(9), D(10))).toEqual([D(10)]);
  });
});

describe("nextSelected - range", () => {
  it("未选中时第一次点击只设起点", () => {
    expect(nextSelected("range", undefined, D(10))).toEqual({ from: D(10) });
  });

  it("已有完整区间时重新开始（只设起点）", () => {
    expect(nextSelected("range", { from: D(1), to: D(5) }, D(10))).toEqual({
      from: D(10),
    });
  });

  it("点击晚于起点的日期时形成区间", () => {
    expect(nextSelected("range", { from: D(10) }, D(20))).toEqual({
      from: D(10),
      to: D(20),
    });
  });

  it("点击早于起点的日期时交换两端", () => {
    expect(nextSelected("range", { from: D(20) }, D(10))).toEqual({
      from: D(10),
      to: D(20),
    });
  });

  it("点击与起点同一天时形成零长度区间", () => {
    expect(nextSelected("range", { from: D(10) }, D(10))).toEqual({
      from: D(10),
      to: D(10),
    });
  });

  it("只有 to 时视为重新开始（只设 from）", () => {
    expect(nextSelected("range", { to: D(20) }, D(10))).toEqual({
      from: D(10),
    });
  });
});
