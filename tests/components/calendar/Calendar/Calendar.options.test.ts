import { describe, expect, it } from "vitest";
import {
  buildMonthOptions,
  buildYearOptions,
  canMoveNext,
  canMovePrev,
  chunkIntoWeeks,
  isDayDisabled,
} from "~/components/calendar/Calendar/Calendar.options";

const D = (day: number, month = 5, year = 2024) => new Date(year, month, day);
/** 月份格式化 stub，便于断言 value → label 的映射 */
const label = (index: number) => `M${index}`;

describe("isDayDisabled", () => {
  it("disabled=true 时所有日期都禁用", () => {
    expect(isDayDisabled(D(10), { disabled: true })).toBe(true);
  });

  it("disabled 是函数时按函数结果决定", () => {
    const disabled = (day: Date) => day.getDate() === 10;

    expect(isDayDisabled(D(10), { disabled })).toBe(true);
    expect(isDayDisabled(D(11), { disabled })).toBe(false);
  });

  it("早于 min 的日期被禁用", () => {
    expect(isDayDisabled(D(9), { min: D(10) })).toBe(true);
  });

  it("等于 min 的日期可选", () => {
    expect(isDayDisabled(D(10), { min: D(10) })).toBe(false);
  });

  it("晚于 max 的日期被禁用", () => {
    expect(isDayDisabled(D(21), { max: D(20) })).toBe(true);
  });

  it("等于 max 的日期可选", () => {
    expect(isDayDisabled(D(20), { max: D(20) })).toBe(false);
  });

  it("在 min / max 之间时可选", () => {
    expect(isDayDisabled(D(15), { min: D(10), max: D(20) })).toBe(false);
  });

  it("没有任何限制时可选", () => {
    expect(isDayDisabled(D(15), {})).toBe(false);
  });

  it("disabled=true 优先于 min / max（即使日期在范围内）", () => {
    expect(
      isDayDisabled(D(15), { disabled: true, min: D(10), max: D(20) }),
    ).toBe(true);
  });

  it("disabled 函数优先于 min / max", () => {
    expect(
      isDayDisabled(D(15), {
        disabled: () => true,
        min: D(10),
        max: D(20),
      }),
    ).toBe(true);
  });

  it("忽略时间部分（同一天不同时刻结果一致）", () => {
    expect(isDayDisabled(new Date(2024, 5, 9, 23, 59), { min: D(10) })).toBe(
      true,
    );
  });
});

describe("buildMonthOptions", () => {
  it("没有 min / max 时返回全部 12 个月", () => {
    const options = buildMonthOptions(2024, {}, label);

    expect(options).toHaveLength(12);
    expect(options[0]).toEqual({ value: "0", label: "M0" });
    expect(options[11]).toEqual({ value: "11", label: "M11" });
  });

  it("min 所在年份里过滤掉早于 min 月份的项", () => {
    const options = buildMonthOptions(2024, { min: D(1, 5) }, label);

    expect(options[0].value).toBe("5");
    expect(options).toHaveLength(7);
  });

  it("min 晚于该年份时全部过滤掉", () => {
    const options = buildMonthOptions(2023, { min: D(1, 5, 2024) }, label);

    expect(options).toEqual([]);
  });

  it("max 所在年份里过滤掉晚于 max 月份的项", () => {
    const options = buildMonthOptions(2024, { max: D(1, 2) }, label);

    expect(options.map((o) => o.value)).toEqual(["0", "1", "2"]);
  });

  it("max 早于该年份时全部过滤掉", () => {
    const options = buildMonthOptions(2025, { max: D(1, 2, 2024) }, label);

    expect(options).toEqual([]);
  });

  it("min / max 同处一年时只保留区间内的月份", () => {
    const options = buildMonthOptions(
      2024,
      { min: D(1, 2), max: D(1, 5) },
      label,
    );

    expect(options.map((o) => o.value)).toEqual(["2", "3", "4", "5"]);
  });

  it("value 是月份索引的字符串（可直接喂给 Select）", () => {
    const options = buildMonthOptions(2024, {}, label);

    expect(options.every((o) => typeof o.value === "string")).toBe(true);
    expect(options[3].value).toBe("3");
  });
});

describe("buildYearOptions", () => {
  it("没有 min / max 时以前后 100 年为范围", () => {
    const years = buildYearOptions({}, 2024);

    expect(years[0]).toBe(1924);
    expect(years.at(-1)).toBe(2124);
    expect(years).toHaveLength(201);
  });

  it("自定义 span", () => {
    const years = buildYearOptions({}, 2024, 2);

    expect(years).toEqual([2022, 2023, 2024, 2025, 2026]);
  });

  it("有 min / max 时夹到其年份", () => {
    const years = buildYearOptions(
      { min: D(1, 0, 2020), max: D(1, 0, 2022) },
      2024,
    );

    expect(years).toEqual([2020, 2021, 2022]);
  });

  it("只有 min 时终点仍用 currentYear + span", () => {
    const years = buildYearOptions({ min: D(1, 0, 2023) }, 2024, 1);

    expect(years).toEqual([2023, 2024, 2025]);
  });

  it("只有 max 时起点仍用 currentYear - span", () => {
    const years = buildYearOptions({ max: D(1, 0, 2025) }, 2024, 1);

    expect(years).toEqual([2023, 2024, 2025]);
  });

  it("max < min 时返回空数组（不产生负长度）", () => {
    expect(
      buildYearOptions({ min: D(1, 0, 2030), max: D(1, 0, 2020) }, 2024),
    ).toEqual([]);
  });
});

describe("canMovePrev", () => {
  it("没有 min 时始终可以往前翻", () => {
    expect(canMovePrev(D(1), undefined)).toBe(true);
  });

  it("当前月晚于 min 所在月时可以往前翻", () => {
    expect(canMovePrev(D(1, 5), D(1, 3))).toBe(true);
  });

  it("当前月等于 min 所在月时不能往前翻", () => {
    expect(canMovePrev(D(1, 5), D(15, 5))).toBe(false);
  });

  it("当前月早于 min 所在月时不能往前翻", () => {
    expect(canMovePrev(D(1, 3), D(1, 5))).toBe(false);
  });

  it("跨年比较（当前年晚于 min 年）", () => {
    expect(canMovePrev(D(1, 0, 2025), D(1, 11, 2024))).toBe(true);
  });

  it("跨年比较（当前年早于 min 年）", () => {
    expect(canMovePrev(D(1, 11, 2023), D(1, 0, 2024))).toBe(false);
  });

  it("忽略传入日期的『日』部分（只比到月）", () => {
    expect(canMovePrev(D(28, 5), D(1, 5))).toBe(false);
    expect(canMovePrev(D(1, 4), D(30, 5))).toBe(false);
  });
});

describe("canMoveNext", () => {
  it("没有 max 时始终可以往后翻", () => {
    expect(canMoveNext(D(1), undefined)).toBe(true);
  });

  it("当前月早于 max 所在月时可以往后翻", () => {
    expect(canMoveNext(D(1, 3), D(1, 5))).toBe(true);
  });

  it("当前月等于 max 所在月时不能往后翻", () => {
    expect(canMoveNext(D(1, 5), D(15, 5))).toBe(false);
  });

  it("当前月晚于 max 所在月时不能往后翻", () => {
    expect(canMoveNext(D(1, 5), D(1, 3))).toBe(false);
  });

  it("跨年比较", () => {
    expect(canMoveNext(D(1, 11, 2023), D(1, 0, 2024))).toBe(true);
    expect(canMoveNext(D(1, 0, 2025), D(1, 11, 2024))).toBe(false);
  });

  it("忽略传入日期的『日』部分", () => {
    expect(canMoveNext(D(1, 5), D(30, 5))).toBe(false);
  });
});

describe("chunkIntoWeeks", () => {
  it("把 7 天切成一周", () => {
    const days = Array.from({ length: 7 }, (_, i) => D(i + 1));

    expect(chunkIntoWeeks(days)).toEqual([days]);
  });

  it("把 14 天切成两周", () => {
    const days = Array.from({ length: 14 }, (_, i) => D(i + 1));
    const weeks = chunkIntoWeeks(days);

    expect(weeks).toHaveLength(2);
    expect(weeks[0]).toHaveLength(7);
    expect(weeks[1]).toHaveLength(7);
  });

  it("35 天（真实日历网格长度）切成 5 周", () => {
    const days = Array.from({ length: 35 }, (_, i) => D(i + 1));

    expect(chunkIntoWeeks(days)).toHaveLength(5);
  });

  it("最后不足 7 天也保留为一组", () => {
    const days = Array.from({ length: 10 }, (_, i) => D(i + 1));
    const weeks = chunkIntoWeeks(days);

    expect(weeks).toHaveLength(2);
    expect(weeks[1]).toHaveLength(3);
  });

  it("空数组返回空数组", () => {
    expect(chunkIntoWeeks([])).toEqual([]);
  });

  it("不修改传入的数组", () => {
    const days = Array.from({ length: 7 }, (_, i) => D(i + 1));
    chunkIntoWeeks(days);

    expect(days).toHaveLength(7);
  });
});
