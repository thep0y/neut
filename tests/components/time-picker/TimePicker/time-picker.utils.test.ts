import { describe, expect, it } from "vitest";
import {
  formatTime,
  getMeridiemLabels,
  getUnitLabel,
  getUnitOptions,
  getUnits,
  getUnitValue,
  pad2,
  withUnit,
  type TimePickerConfig,
} from "~/components/time-picker/TimePicker/time-picker.utils";

const baseConfig: TimePickerConfig = {
  hourCycle: 24,
  showSeconds: false,
  hourStep: 1,
  minuteStep: 1,
  secondStep: 1,
};

function config(overrides: Partial<TimePickerConfig> = {}): TimePickerConfig {
  return { ...baseConfig, ...overrides };
}

describe("pad2", () => {
  it("个位数补零", () => {
    expect(pad2(0)).toBe("00");
    expect(pad2(9)).toBe("09");
  });

  it("两位数原样", () => {
    expect(pad2(10)).toBe("10");
    expect(pad2(59)).toBe("59");
  });

  it("三位数不截断", () => {
    expect(pad2(100)).toBe("100");
  });
});

describe("getUnitLabel", () => {
  it("每个单位都有无障碍名称", () => {
    expect(getUnitLabel("hour")).toBe("Hour");
    expect(getUnitLabel("minute")).toBe("Minute");
    expect(getUnitLabel("second")).toBe("Second");
    expect(getUnitLabel("meridiem")).toBe("AM/PM");
  });
});

describe("getUnits", () => {
  it("24 小时制默认只有小时与分钟", () => {
    expect(getUnits(config())).toEqual(["hour", "minute"]);
  });

  it("showSeconds 时追加秒列", () => {
    expect(getUnits(config({ showSeconds: true }))).toEqual([
      "hour",
      "minute",
      "second",
    ]);
  });

  it("12 小时制追加 AM/PM 列", () => {
    expect(getUnits(config({ hourCycle: 12 }))).toEqual([
      "hour",
      "minute",
      "meridiem",
    ]);
  });

  it("12 小时制 + 秒 => 四列，顺序为 时/分/秒/AM-PM", () => {
    expect(getUnits(config({ hourCycle: 12, showSeconds: true }))).toEqual([
      "hour",
      "minute",
      "second",
      "meridiem",
    ]);
  });
});

describe("getUnitOptions - hour", () => {
  it("24 小时制生成 0..23", () => {
    const options = getUnitOptions("hour", config());

    expect(options).toHaveLength(24);
    expect(options[0]).toEqual({ value: 0, label: "00" });
    expect(options[23]).toEqual({ value: 23, label: "23" });
  });

  it("12 小时制生成 1..12（避免 12h 映射出现重复项）", () => {
    const options = getUnitOptions("hour", config({ hourCycle: 12 }));

    expect(options).toHaveLength(12);
    expect(options[0]).toEqual({ value: 1, label: "01" });
    expect(options[11]).toEqual({ value: 12, label: "12" });
  });

  it("步长 6 时只保留 0/6/12/18", () => {
    expect(
      getUnitOptions("hour", config({ hourStep: 6 })).map((o) => o.value),
    ).toEqual([0, 6, 12, 18]);
  });

  it("步长 12 在 24 小时制下是 0/12", () => {
    expect(
      getUnitOptions("hour", config({ hourStep: 12 })).map((o) => o.value),
    ).toEqual([0, 12]);
  });

  it("步长 0 或负数被夹到 1（避免死循环）", () => {
    expect(getUnitOptions("hour", config({ hourStep: 0 }))).toHaveLength(24);
    expect(getUnitOptions("hour", config({ hourStep: -5 }))).toHaveLength(24);
  });

  it("小数步长向下取整", () => {
    expect(
      getUnitOptions("hour", config({ hourStep: 2.9 })).map((o) => o.value),
    ).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]);
  });

  it("步长大于范围时只有起点", () => {
    expect(
      getUnitOptions("hour", config({ hourStep: 100 })).map((o) => o.value),
    ).toEqual([0]);
  });
});

describe("getUnitOptions - minute / second", () => {
  it("分钟生成 0..59", () => {
    const options = getUnitOptions("minute", config());

    expect(options).toHaveLength(60);
    expect(options[0]).toEqual({ value: 0, label: "00" });
    expect(options[59]).toEqual({ value: 59, label: "59" });
  });

  it("分钟步长 15", () => {
    expect(
      getUnitOptions("minute", config({ minuteStep: 15 })).map((o) => o.value),
    ).toEqual([0, 15, 30, 45]);
  });

  it("秒列使用 secondStep", () => {
    expect(
      getUnitOptions("second", config({ secondStep: 30 })).map((o) => o.value),
    ).toEqual([0, 30]);
  });

  it("秒列不受 minuteStep 影响", () => {
    expect(getUnitOptions("second", config({ minuteStep: 15 }))).toHaveLength(
      60,
    );
  });
});

describe("getUnitOptions - meridiem", () => {
  it("始终返回 AM / PM 两项", () => {
    const options = getUnitOptions("meridiem", config({ hourCycle: 12 }));

    expect(options).toHaveLength(2);
    expect(options[0].value).toBe("AM");
    expect(options[1].value).toBe("PM");
  });

  it("英文 locale 下标签为 AM / PM", () => {
    const options = getUnitOptions(
      "meridiem",
      config({ hourCycle: 12, locale: "en-US" }),
    );

    expect(options.map((o) => o.label)).toEqual(["AM", "PM"]);
  });

  it("中文 locale 下使用本地化文案且两者不同", () => {
    const options = getUnitOptions(
      "meridiem",
      config({ hourCycle: 12, locale: "zh-CN" }),
    );

    expect(options[0].label).not.toBe("");
    expect(options[1].label).not.toBe(options[0].label);
  });
});

describe("getMeridiemLabels", () => {
  it("英文返回 AM / PM", () => {
    const labels = getMeridiemLabels("en-US");

    expect(labels.am).toBe("AM");
    expect(labels.pm).toBe("PM");
  });

  it("两个标签不相同", () => {
    const labels = getMeridiemLabels("en-US");

    expect(labels.am).not.toBe(labels.pm);
  });

  it("不传 locale 时也能返回字符串", () => {
    const labels = getMeridiemLabels();

    expect(typeof labels.am).toBe("string");
    expect(typeof labels.pm).toBe("string");
  });

  it("格式非法的 locale 会抛 RangeError（Intl 的标准行为）", () => {
    // `getMeridiemLabels` 里的 `?? "AM"` 只兜底"取不到 dayPeriod"的情况，
    // 格式非法的 tag 由 Intl 自己抛 RangeError —— 这里锁定该边界，
    // 提醒调用方应传合法 locale 而不是错误字符串。
    expect(() => getMeridiemLabels("not-a-real-locale!!!")).toThrow(RangeError);
  });

  it("未知但格式合法的 locale 回退到英文 AM / PM", () => {
    const labels = getMeridiemLabels("xx");

    expect(labels.am).toBe("AM");
    expect(labels.pm).toBe("PM");
  });
});

describe("getUnitValue", () => {
  const date = new Date(2024, 0, 1, 15, 30, 45);

  it("date 为 undefined 时返回 undefined", () => {
    expect(getUnitValue(undefined, "hour", 24)).toBeUndefined();
  });

  it("24 小时制返回 0..23 的小时", () => {
    expect(getUnitValue(date, "hour", 24)).toBe(15);
  });

  it("12 小时制返回 1..12 的展示值", () => {
    expect(getUnitValue(date, "hour", 12)).toBe(3);
  });

  it("12 小时制下 0 点显示为 12（而不是 0）", () => {
    expect(getUnitValue(new Date(2024, 0, 1, 0), "hour", 12)).toBe(12);
  });

  it("12 小时制下 12 点显示为 12", () => {
    expect(getUnitValue(new Date(2024, 0, 1, 12), "hour", 12)).toBe(12);
  });

  it("分钟", () => {
    expect(getUnitValue(date, "minute", 24)).toBe(30);
  });

  it("秒", () => {
    expect(getUnitValue(date, "second", 24)).toBe(45);
  });

  it("上午返回 AM", () => {
    expect(getUnitValue(new Date(2024, 0, 1, 9), "meridiem", 12)).toBe("AM");
  });

  it("下午返回 PM", () => {
    expect(getUnitValue(date, "meridiem", 12)).toBe("PM");
  });

  it("0 点算 AM", () => {
    expect(getUnitValue(new Date(2024, 0, 1, 0), "meridiem", 12)).toBe("AM");
  });

  it("12 点整算 PM（边界）", () => {
    expect(getUnitValue(new Date(2024, 0, 1, 12), "meridiem", 12)).toBe("PM");
  });

  it("11:59 算 AM", () => {
    expect(getUnitValue(new Date(2024, 0, 1, 11, 59), "meridiem", 12)).toBe(
      "AM",
    );
  });
});

describe("withUnit", () => {
  const base = new Date(2024, 5, 15, 9, 30, 45);

  it("设置小时（24 小时制）且不动其它字段", () => {
    const next = withUnit(base, "hour", 20, 24);

    expect(next.getHours()).toBe(20);
    expect(next.getMinutes()).toBe(30);
    expect(next.getSeconds()).toBe(45);
    expect(next.getDate()).toBe(15);
  });

  it("设置分钟", () => {
    const next = withUnit(base, "minute", 5, 24);

    expect(next.getMinutes()).toBe(5);
    expect(next.getHours()).toBe(9);
  });

  it("设置秒", () => {
    const next = withUnit(base, "second", 7, 24);

    expect(next.getSeconds()).toBe(7);
    expect(next.getMinutes()).toBe(30);
  });

  it("不修改原 Date（返回新实例）", () => {
    const next = withUnit(base, "hour", 20, 24);

    expect(next).not.toBe(base);
    expect(base.getHours()).toBe(9);
  });

  it("12 小时制设置上午小时（保留 AM）", () => {
    // base 是 9:30（AM），设置为 3 点 => 3:30 AM
    const next = withUnit(base, "hour", 3, 12);

    expect(next.getHours()).toBe(3);
  });

  it("12 小时制设置下午小时（保留 PM）", () => {
    const afternoon = new Date(2024, 5, 15, 15, 30, 45);
    // 15:30 是 PM，设置展示值 3 => 15:30
    const next = withUnit(afternoon, "hour", 3, 12);

    expect(next.getHours()).toBe(15);
  });

  it("12 小时制下展示值 12 在 AM 时映射为 0 点", () => {
    const morning = new Date(2024, 5, 15, 9, 0, 0);
    const next = withUnit(morning, "hour", 12, 12);

    expect(next.getHours()).toBe(0);
  });

  it("12 小时制下展示值 12 在 PM 时映射为 12 点", () => {
    const afternoon = new Date(2024, 5, 15, 15, 0, 0);
    const next = withUnit(afternoon, "hour", 12, 12);

    expect(next.getHours()).toBe(12);
  });

  it("meridiem 设为 PM 时把小时推到下午", () => {
    const next = withUnit(base, "meridiem", "PM", 12);

    expect(next.getHours()).toBe(21);
  });

  it("meridiem 设为 AM 时把小时拉回上午", () => {
    const afternoon = new Date(2024, 5, 15, 15, 30, 0);
    const next = withUnit(afternoon, "meridiem", "AM", 12);

    expect(next.getHours()).toBe(3);
  });

  it("meridiem 保持 12 点语义（12 PM 仍是 12）", () => {
    const noon = new Date(2024, 5, 15, 12, 0, 0);
    const next = withUnit(noon, "meridiem", "PM", 12);

    expect(next.getHours()).toBe(12);
  });

  it("meridiem 设为 AM 时 12 点变成 0 点", () => {
    const noon = new Date(2024, 5, 15, 12, 0, 0);
    const next = withUnit(noon, "meridiem", "AM", 12);

    expect(next.getHours()).toBe(0);
  });

  it("meridiem 字符串值走 Number() 后不影响小时（NaN 分支不会命中）", () => {
    // TimePickerUnitValue 是 number | "AM" | "PM"，所以分钟列一定是 number；
    // 这里锁定"传数字时行为稳定"，避免误以为实现依赖字符串隐式转换。
    const next = withUnit(base, "minute", 5, 24);

    expect(next.getMinutes()).toBe(5);
  });

  it("设置越界的小时会自然进位（Date 语义）", () => {
    const next = withUnit(base, "hour", 25, 24);

    // setHours(25) => 次日 1 点
    expect(next.getDate()).toBe(16);
    expect(next.getHours()).toBe(1);
  });
});

describe("formatTime", () => {
  it("24 小时制补零输出 HH:mm", () => {
    expect(formatTime(new Date(2024, 0, 1, 9, 5), baseConfig)).toBe("09:05");
  });

  it("24 小时制 0 点输出 00:00", () => {
    expect(formatTime(new Date(2024, 0, 1, 0, 0), baseConfig)).toBe("00:00");
  });

  it("24 小时制 23:59 输出 23:59", () => {
    expect(formatTime(new Date(2024, 0, 1, 23, 59), baseConfig)).toBe("23:59");
  });

  it("showSeconds 时追加秒", () => {
    expect(
      formatTime(new Date(2024, 0, 1, 9, 5, 7), config({ showSeconds: true })),
    ).toBe("09:05:07");
  });

  it("12 小时制带 AM/PM 后缀", () => {
    expect(
      formatTime(
        new Date(2024, 0, 1, 9, 5),
        config({ hourCycle: 12, locale: "en-US" }),
      ),
    ).toBe("9:05 AM");
  });

  it("12 小时制下午用 PM", () => {
    expect(
      formatTime(
        new Date(2024, 0, 1, 15, 5),
        config({ hourCycle: 12, locale: "en-US" }),
      ),
    ).toBe("3:05 PM");
  });

  it("12 小时制 0 点显示为 12 AM", () => {
    expect(
      formatTime(
        new Date(2024, 0, 1, 0, 0),
        config({ hourCycle: 12, locale: "en-US" }),
      ),
    ).toBe("12:00 AM");
  });

  it("12 小时制 12 点显示为 12 PM", () => {
    expect(
      formatTime(
        new Date(2024, 0, 1, 12, 0),
        config({ hourCycle: 12, locale: "en-US" }),
      ),
    ).toBe("12:00 PM");
  });

  it("12 小时制 + 秒", () => {
    expect(
      formatTime(
        new Date(2024, 0, 1, 15, 5, 7),
        config({ hourCycle: 12, showSeconds: true, locale: "en-US" }),
      ),
    ).toBe("3:05:07 PM");
  });

  it("12 小时制下不补零小时（9 而不是 09）", () => {
    expect(
      formatTime(
        new Date(2024, 0, 1, 9, 5),
        config({ hourCycle: 12, locale: "en-US" }),
      ).startsWith("9:"),
    ).toBe(true);
  });
});
