import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfWeek,
  formatMonthShort,
  formatMonthYear,
  formatWeekday,
  getFirstDate,
  getISOWeekNumber,
  isAfter,
  isAfterOrSame,
  isBefore,
  isBeforeOrSame,
  isSameDay,
  resolveInitialMonth,
  resolveLocaleCode,
  startOfMonth,
  startOfWeek,
  toDateOnly,
} from "~/components/calendar/Calendar/Calendar.utils";

describe("toDateOnly", () => {
  it("抹掉时间部分，保留年月日", () => {
    const result = toDateOnly(new Date(2024, 5, 15, 13, 45, 30, 500));

    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(15);
  });

  it("已经是零点的日期不变", () => {
    expect(toDateOnly(new Date(2024, 0, 1)).getTime()).toBe(
      new Date(2024, 0, 1).getTime(),
    );
  });
});

describe("startOfMonth", () => {
  it("返回当月第一天", () => {
    expect(startOfMonth(new Date(2024, 5, 15)).getDate()).toBe(1);
  });

  it("保留年月并清掉时间", () => {
    const result = startOfMonth(new Date(2024, 5, 15, 23, 59));

    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(5);
    expect(result.getHours()).toBe(0);
  });

  it("已经是第一天时原样", () => {
    expect(startOfMonth(new Date(2024, 5, 1)).getDate()).toBe(1);
  });
});

describe("addMonths", () => {
  it("向后加月", () => {
    expect(addMonths(new Date(2024, 0, 15), 2).getMonth()).toBe(2);
  });

  it("跨年向后", () => {
    const result = addMonths(new Date(2024, 11, 15), 1);

    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(0);
  });

  it("向前减月", () => {
    const result = addMonths(new Date(2024, 0, 15), -1);

    expect(result.getFullYear()).toBe(2023);
    expect(result.getMonth()).toBe(11);
  });

  it("结果总是当月 1 号", () => {
    expect(addMonths(new Date(2024, 5, 28), 1).getDate()).toBe(1);
  });

  it("跨多年", () => {
    const result = addMonths(new Date(2024, 5, 1), 25);

    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(6);
  });
});

describe("addDays", () => {
  it("向后加天", () => {
    expect(addDays(new Date(2024, 5, 15), 5).getDate()).toBe(20);
  });

  it("向前减天", () => {
    expect(addDays(new Date(2024, 5, 15), -5).getDate()).toBe(10);
  });

  it("跨月进位", () => {
    const result = addDays(new Date(2024, 5, 30), 1);

    expect(result.getMonth()).toBe(6);
    expect(result.getDate()).toBe(1);
  });

  it("跨年进位", () => {
    const result = addDays(new Date(2024, 11, 31), 1);

    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });

  it("闰年 2 月 29 日 + 1 天进入 3 月", () => {
    const result = addDays(new Date(2024, 1, 29), 1);

    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(1);
  });
});

describe("isSameDay", () => {
  it("同一天不同时刻为 true", () => {
    expect(
      isSameDay(new Date(2024, 5, 15, 0, 0), new Date(2024, 5, 15, 23, 59)),
    ).toBe(true);
  });

  it("不同天为 false", () => {
    expect(isSameDay(new Date(2024, 5, 15), new Date(2024, 5, 16))).toBe(false);
  });

  it("同月日不同年时为 false", () => {
    expect(isSameDay(new Date(2024, 5, 15), new Date(2025, 5, 15))).toBe(false);
  });
});

describe("isBefore / isAfter", () => {
  it("isBefore 忽略时间部分（15 日 23:59 早于 16 日 00:00）", () => {
    expect(
      isBefore(new Date(2024, 5, 15, 23, 59), new Date(2024, 5, 16, 0, 0)),
    ).toBe(true);
  });

  it("isBefore 对同一天返回 false", () => {
    expect(isBefore(new Date(2024, 5, 15, 1), new Date(2024, 5, 15, 23))).toBe(
      false,
    );
  });

  it("isAfter 对同一天返回 false", () => {
    expect(isAfter(new Date(2024, 5, 15, 23), new Date(2024, 5, 15, 1))).toBe(
      false,
    );
  });

  it("isAfter 忽略时间部分", () => {
    expect(
      isAfter(new Date(2024, 5, 16, 0, 0), new Date(2024, 5, 15, 23, 59)),
    ).toBe(true);
  });
});

describe("isBeforeOrSame / isAfterOrSame", () => {
  it("同一天算「或相同」", () => {
    expect(
      isBeforeOrSame(new Date(2024, 5, 15, 23), new Date(2024, 5, 15, 1)),
    ).toBe(true);
    expect(
      isAfterOrSame(new Date(2024, 5, 15, 1), new Date(2024, 5, 15, 23)),
    ).toBe(true);
  });

  it("跨天时按先后判断", () => {
    expect(isBeforeOrSame(new Date(2024, 5, 15), new Date(2024, 5, 16))).toBe(
      true,
    );
    expect(isAfterOrSame(new Date(2024, 5, 15), new Date(2024, 5, 16))).toBe(
      false,
    );
  });
});

describe("startOfWeek / endOfWeek", () => {
  it("weekStartsOn=0（周日）时回到本周日", () => {
    // 2024-06-15 是周六
    const result = startOfWeek(new Date(2024, 5, 15), 0);

    expect(result.getDay()).toBe(0);
    expect(result.getDate()).toBe(9);
  });

  it("weekStartsOn=1（周一）时回到本周一", () => {
    const result = startOfWeek(new Date(2024, 5, 15), 1);

    expect(result.getDay()).toBe(1);
    expect(result.getDate()).toBe(10);
  });

  it("默认按周日开始", () => {
    expect(startOfWeek(new Date(2024, 5, 15)).getDay()).toBe(0);
  });

  it("已经是周首日时返回当天", () => {
    const sunday = new Date(2024, 5, 9);

    expect(startOfWeek(sunday, 0).getTime()).toBe(sunday.getTime());
  });

  it("会清掉时间部分", () => {
    expect(startOfWeek(new Date(2024, 5, 15, 23, 59), 0).getHours()).toBe(0);
  });

  it("endOfWeek 是 startOfWeek + 6 天", () => {
    const result = endOfWeek(new Date(2024, 5, 15), 0);

    expect(result.getDay()).toBe(6);
    expect(result.getDate()).toBe(15);
  });

  it("跨月时 startOfWeek 正确回退", () => {
    // 2024-07-01 是周一
    const result = startOfWeek(new Date(2024, 6, 1), 0);

    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(30);
  });
});

describe("eachDayOfInterval", () => {
  it("返回闭区间的每一天", () => {
    const days = eachDayOfInterval(new Date(2024, 5, 1), new Date(2024, 5, 5));

    expect(days).toHaveLength(5);
    expect(days.map((d) => d.getDate())).toEqual([1, 2, 3, 4, 5]);
  });

  it("起止同一天时只返回一天", () => {
    expect(
      eachDayOfInterval(new Date(2024, 5, 5), new Date(2024, 5, 5)),
    ).toHaveLength(1);
  });

  it("忽略时间部分（同一天不同时刻也算一天）", () => {
    expect(
      eachDayOfInterval(new Date(2024, 5, 1, 23), new Date(2024, 5, 1, 1)),
    ).toHaveLength(1);
  });

  it("跨月连续", () => {
    const days = eachDayOfInterval(new Date(2024, 5, 29), new Date(2024, 6, 2));

    expect(days.map((d) => `${d.getMonth()}-${d.getDate()}`)).toEqual([
      "5-29",
      "5-30",
      "6-1",
      "6-2",
    ]);
  });

  it("起点晚于终点时返回空数组", () => {
    expect(
      eachDayOfInterval(new Date(2024, 5, 5), new Date(2024, 5, 1)),
    ).toEqual([]);
  });

  it("返回的每一天都是零点", () => {
    const days = eachDayOfInterval(new Date(2024, 5, 1), new Date(2024, 5, 3));

    for (const day of days) {
      expect(day.getHours()).toBe(0);
    }
  });

  it("不共享同一个 Date 实例（避免后续修改互相影响）", () => {
    const days = eachDayOfInterval(new Date(2024, 5, 1), new Date(2024, 5, 3));

    expect(days[0]).not.toBe(days[1]);
  });
});

describe("resolveLocaleCode", () => {
  it("undefined 返回 undefined", () => {
    expect(resolveLocaleCode(undefined)).toBeUndefined();
  });

  it("空字符串返回 undefined", () => {
    expect(resolveLocaleCode("")).toBeUndefined();
  });

  it("字符串原样返回", () => {
    expect(resolveLocaleCode("zh-CN")).toBe("zh-CN");
  });

  it("对象取 code 字段", () => {
    expect(resolveLocaleCode({ code: "en-US" })).toBe("en-US");
  });

  it("对象缺少 code 时返回 undefined", () => {
    expect(resolveLocaleCode({})).toBeUndefined();
  });
});

describe("getFirstDate", () => {
  it("单个 Date 直接返回", () => {
    const date = new Date(2024, 5, 15);

    expect(getFirstDate(date)).toBe(date);
  });

  it("数组取第一个元素", () => {
    const first = new Date(2024, 5, 1);
    const second = new Date(2024, 5, 2);

    expect(getFirstDate([first, second])).toBe(first);
  });

  it("空数组返回 undefined", () => {
    expect(getFirstDate([])).toBeUndefined();
  });

  it("range 取 from", () => {
    const from = new Date(2024, 5, 1);

    expect(getFirstDate({ from, to: new Date(2024, 5, 10) })).toBe(from);
  });

  it("range 只有 to 时返回 to", () => {
    const to = new Date(2024, 5, 10);

    expect(getFirstDate({ to })).toBe(to);
  });

  it("空 range 返回 undefined", () => {
    expect(getFirstDate({})).toBeUndefined();
  });

  it("undefined 返回 undefined", () => {
    expect(getFirstDate(undefined)).toBeUndefined();
  });
});

describe("formatWeekday", () => {
  it("英文返回短星期名", () => {
    // 2024-06-15 是周六
    expect(formatWeekday(new Date(2024, 5, 15), "en-US")).toBe("Sat");
  });

  it("中文返回本地化星期名", () => {
    const result = formatWeekday(new Date(2024, 5, 15), "zh-CN");

    expect(result).not.toBe("");
    expect(result).not.toBe("Sat");
  });

  it("不传 locale 时也能返回", () => {
    expect(typeof formatWeekday(new Date(2024, 5, 15))).toBe("string");
  });
});

describe("formatMonthYear", () => {
  it("英文返回「月 年」", () => {
    expect(formatMonthYear(new Date(2024, 5, 15), "en-US")).toBe("June 2024");
  });

  it("包含年份", () => {
    expect(formatMonthYear(new Date(2024, 0, 1), "en-US")).toContain("2024");
  });
});

describe("formatMonthShort", () => {
  it("英文返回短月名", () => {
    expect(formatMonthShort(new Date(2024, 5, 15), "en-US")).toBe("Jun");
  });

  it("不同月份返回不同文案", () => {
    expect(formatMonthShort(new Date(2024, 0, 1), "en-US")).not.toBe(
      formatMonthShort(new Date(2024, 5, 1), "en-US"),
    );
  });
});

describe("getISOWeekNumber", () => {
  it("每年 1 月 4 日总在第 1 周（ISO 定义）", () => {
    expect(getISOWeekNumber(new Date(2024, 0, 4))).toBe(1);
    expect(getISOWeekNumber(new Date(2023, 0, 4))).toBe(1);
  });

  it("2024-01-01（周一）是第 1 周", () => {
    expect(getISOWeekNumber(new Date(2024, 0, 1))).toBe(1);
  });

  it("2024-06-15 属于第 24 周", () => {
    expect(getISOWeekNumber(new Date(2024, 5, 15))).toBe(24);
  });

  it("年末可能属于下一年的第 1 周", () => {
    // 2024-12-30 是周一，按 ISO 属于 2025 年第 1 周
    expect(getISOWeekNumber(new Date(2024, 11, 30))).toBe(1);
  });

  it("年初可能属于上一年的最后一周", () => {
    // 2023-01-01 是周日，按 ISO 属于 2022 年第 52 周
    expect(getISOWeekNumber(new Date(2023, 0, 1))).toBe(52);
  });

  it("结果始终落在 1..53", () => {
    for (let month = 0; month < 12; month += 1) {
      const week = getISOWeekNumber(new Date(2024, month, 15));
      expect(week).toBeGreaterThanOrEqual(1);
      expect(week).toBeLessThanOrEqual(53);
    }
  });

  it("忽略时间部分", () => {
    expect(getISOWeekNumber(new Date(2024, 5, 15, 23, 59))).toBe(
      getISOWeekNumber(new Date(2024, 5, 15, 0, 0)),
    );
  });
});

describe("resolveInitialMonth", () => {
  const today = new Date(2024, 4, 15);

  it("受控 month 优先", () => {
    expect(
      resolveInitialMonth({
        month: new Date(2024, 0, 10),
        defaultMonth: new Date(2023, 0, 1),
      }),
    ).toEqual(new Date(2024, 0, 10));
  });

  it("其次 defaultMonth", () => {
    expect(resolveInitialMonth({ defaultMonth: new Date(2023, 6, 1) })).toEqual(
      new Date(2023, 6, 1),
    );
  });

  it("再取选中日期（selected 优先于 defaultSelected）", () => {
    expect(
      resolveInitialMonth({
        selected: today,
        defaultSelected: new Date(2020, 0, 1),
      }),
    ).toEqual(today);
    expect(resolveInitialMonth({ defaultSelected: today })).toEqual(today);
  });

  it("都没有时回退到今天", () => {
    const before = Date.now();

    const resolved = resolveInitialMonth({});

    expect(resolved.getTime()).toBeGreaterThanOrEqual(before);
  });
});
