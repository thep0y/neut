import { render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTimePickerState,
  type TimePickerStateProps,
  useTimePickerContext,
} from "~/components/time-picker/TimePicker/TimePicker.context";

/**
 * `createTimePickerState` 是 TimePicker 的唯一状态源：受控/非受控值、派生配置、
 * 列注册表。这里直接驱动它（它只创建 signal，不依赖 DOM），组件层的行为在
 * `time-picker.integration.test.tsx` 里验证。
 */

function mountState(overrides: Partial<TimePickerStateProps> = {}) {
  // props 用可变对象：accessor 每次读取最新值，等价于 Solid 的响应式 props 代理
  const props: TimePickerStateProps = { ...overrides };
  return { state: createTimePickerState(props), props };
}

beforeEach(() => {
  // 让"无值时以创建时刻为基准"这条路径可复现
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2024, 5, 15, 10, 20, 30));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("createTimePickerState - 受控/非受控", () => {
  it("非受控：defaultValue 初始化内部值", () => {
    const { state } = mountState({ defaultValue: new Date(2024, 0, 1, 9, 5) });

    expect(state.value()?.getHours()).toBe(9);
    expect(state.value()?.getMinutes()).toBe(5);
  });

  it("非受控：没有 defaultValue 时初始无值", () => {
    const { state } = mountState();

    expect(state.value()).toBeUndefined();
  });

  it("非受控：setUnitValue 写内部状态并回调 onValueChange", () => {
    const onValueChange = vi.fn();
    const { state } = mountState({
      defaultValue: new Date(2024, 0, 1, 9, 5),
      onValueChange,
    });

    state.setUnitValue("minute", 45, { reason: "option-press" });

    expect(state.value()?.getHours()).toBe(9);
    expect(state.value()?.getMinutes()).toBe(45);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0]![0].getMinutes()).toBe(45);
    expect(onValueChange.mock.calls[0]![1].reason).toBe("option-press");
  });

  it("非受控：无值时以组件创建时刻为基准，只改被操作的字段", () => {
    const { state } = mountState();

    state.setUnitValue("minute", 45);

    // baseDate 被冻结在 2024-06-15 10:20:30
    expect(state.value()?.getFullYear()).toBe(2024);
    expect(state.value()?.getMonth()).toBe(5);
    expect(state.value()?.getDate()).toBe(15);
    expect(state.value()?.getHours()).toBe(10);
    expect(state.value()?.getMinutes()).toBe(45);
    expect(state.value()?.getSeconds()).toBe(30);
  });

  it("受控：setUnitValue 只回调、不写内部状态", () => {
    const controlled = new Date(2024, 0, 1, 9, 5);
    const onValueChange = vi.fn();
    const { state } = mountState({ value: controlled, onValueChange });

    state.setUnitValue("minute", 45, { reason: "keyboard" });

    expect(state.value()).toBe(controlled);
    expect(state.value()?.getMinutes()).toBe(5);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0]![0].getMinutes()).toBe(45);
  });

  it("受控：外部回写 props.value 后 UI 跟随", () => {
    const { state, props } = mountState({
      value: new Date(2024, 0, 1, 9, 0),
    });

    expect(state.value()?.getHours()).toBe(9);

    props.value = new Date(2024, 0, 1, 17, 0);

    expect(state.value()?.getHours()).toBe(17);
  });
});

describe("createTimePickerState - setUnitValue 的事件详情", () => {
  it("不传 options 时 reason 回退为 none", () => {
    const onValueChange = vi.fn();
    const { state } = mountState({
      defaultValue: new Date(2024, 0, 1, 9, 0),
      onValueChange,
    });

    state.setUnitValue("minute", 30);

    expect(onValueChange.mock.calls[0]![1].reason).toBe("none");
    expect(onValueChange.mock.calls[0]![1].event).toBeUndefined();
    expect(onValueChange.mock.calls[0]![1].trigger).toBeUndefined();
  });

  it("透传 options 里的 reason / event / trigger", () => {
    const onValueChange = vi.fn();
    const event = new Event("click");
    const trigger = document.createElement("div");
    const { state } = mountState({
      defaultValue: new Date(2024, 0, 1, 9, 0),
      onValueChange,
    });

    state.setUnitValue("minute", 30, { reason: "input", event, trigger });

    const details = onValueChange.mock.calls[0]![1];
    expect(details.reason).toBe("input");
    expect(details.event).toBe(event);
    expect(details.trigger).toBe(trigger);
  });

  it("回调里 cancel() 后非受控组件不提交本次变更", () => {
    const { state } = mountState({
      defaultValue: new Date(2024, 0, 1, 9, 0),
      onValueChange: (_value, details) => details.cancel(),
    });

    state.setUnitValue("minute", 45);

    expect(state.value()?.getMinutes()).toBe(0);
  });

  it("回调里未 cancel() 时正常提交", () => {
    const seen: boolean[] = [];
    const { state } = mountState({
      defaultValue: new Date(2024, 0, 1, 9, 0),
      onValueChange: (_value, details) => {
        seen.push(details.isCanceled);
      },
    });

    state.setUnitValue("minute", 45);

    expect(seen).toEqual([false]);
    expect(state.value()?.getMinutes()).toBe(45);
  });

  it("disabled 时直接返回：不回调、不写状态", () => {
    const onValueChange = vi.fn();
    const { state } = mountState({
      defaultValue: new Date(2024, 0, 1, 9, 0),
      disabled: true,
      onValueChange,
    });

    state.setUnitValue("minute", 45);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(state.value()?.getMinutes()).toBe(0);
  });

  it("readOnly 时直接返回：不回调、不写状态", () => {
    const onValueChange = vi.fn();
    const { state } = mountState({
      defaultValue: new Date(2024, 0, 1, 9, 0),
      readOnly: true,
      onValueChange,
    });

    state.setUnitValue("minute", 45);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(state.value()?.getMinutes()).toBe(0);
  });
});

describe("createTimePickerState - 派生配置", () => {
  it("hourCycle 默认 24、可显式传 12", () => {
    expect(mountState().state.hourCycle()).toBe(24);
    expect(mountState({ hourCycle: 12 }).state.hourCycle()).toBe(12);
  });

  it("showSeconds 默认 false，只有显式 true 才为 true", () => {
    expect(mountState().state.showSeconds()).toBe(false);
    expect(mountState({ showSeconds: false }).state.showSeconds()).toBe(false);
    expect(mountState({ showSeconds: true }).state.showSeconds()).toBe(true);
  });

  it("disabled / readOnly 只有显式 true 才为 true", () => {
    expect(mountState().state.disabled()).toBe(false);
    expect(mountState({ disabled: true }).state.disabled()).toBe(true);
    expect(mountState().state.readOnly()).toBe(false);
    expect(mountState({ readOnly: true }).state.readOnly()).toBe(true);
  });

  it("placeholder / dir 直接透传（缺省为 undefined）", () => {
    expect(mountState().state.placeholder()).toBeUndefined();
    expect(mountState({ placeholder: "HH:mm" }).state.placeholder()).toBe(
      "HH:mm",
    );
    expect(mountState().state.dir()).toBeUndefined();
    expect(mountState({ dir: "rtl" }).state.dir()).toBe("rtl");
  });

  it("units 按 showSeconds / hourCycle 组合", () => {
    expect(mountState().state.units()).toEqual(["hour", "minute"]);
    expect(mountState({ showSeconds: true }).state.units()).toEqual([
      "hour",
      "minute",
      "second",
    ]);
    expect(mountState({ hourCycle: 12 }).state.units()).toEqual([
      "hour",
      "minute",
      "meridiem",
    ]);
  });

  it("步长默认全为 1", () => {
    const { state } = mountState();

    expect(state.getOptions("hour")).toHaveLength(24);
    expect(state.getOptions("minute")).toHaveLength(60);
    expect(state.getOptions("second")).toHaveLength(60);
  });

  it("步长透传到各列选项", () => {
    const { state } = mountState({
      hourStep: 6,
      minuteStep: 15,
      secondStep: 30,
    });

    expect(state.getOptions("hour").map((o) => o.value)).toEqual([
      0, 6, 12, 18,
    ]);
    expect(state.getOptions("minute").map((o) => o.value)).toEqual([
      0, 15, 30, 45,
    ]);
    expect(state.getOptions("second").map((o) => o.value)).toEqual([0, 30]);
  });

  it("getOptions('meridiem') 走 Intl 文案", () => {
    const { state } = mountState({ hourCycle: 12, locale: "en-US" });

    expect(state.getOptions("meridiem").map((o) => o.label)).toEqual([
      "AM",
      "PM",
    ]);
  });

  it("Intl 取不到 dayPeriod 时回退硬编码 AM / PM", () => {
    // 系统边界（Intl/CLDR）在测试环境里总能取到 dayPeriod，用假的 Intl 构造兜底：
    // 先返回哨兵值证明替换生效，再返回空数组走 `?? "AM"/"PM"`。
    let parts: Intl.DateTimeFormatPart[] = [{ type: "dayPeriod", value: "ZZ" }];
    vi.stubGlobal("Intl", {
      DateTimeFormat: class {
        formatToParts(): Intl.DateTimeFormatPart[] {
          return parts;
        }
      },
    });
    const { state } = mountState({ hourCycle: 12 });

    expect(state.getOptions("meridiem").map((o) => o.label)).toEqual([
      "ZZ",
      "ZZ",
    ]);

    parts = [];
    expect(state.getOptions("meridiem").map((o) => o.label)).toEqual([
      "AM",
      "PM",
    ]);
  });

  it("formatTime 缺省用内置格式化，提供时走自定义", () => {
    expect(
      mountState({ value: new Date(2024, 0, 1, 9, 5) }).state.formatTime(
        new Date(2024, 0, 1, 9, 5),
      ),
    ).toBe("09:05");
    expect(
      mountState({ formatTime: () => "CUSTOM" }).state.formatTime(new Date()),
    ).toBe("CUSTOM");
  });

  it("getUnitValue 无值返回 undefined，有值返回对应单位", () => {
    expect(mountState().state.getUnitValue("hour")).toBeUndefined();
    const { state } = mountState({ value: new Date(2024, 0, 1, 15, 30, 45) });

    expect(state.getUnitValue("hour")).toBe(15);
    expect(state.getUnitValue("minute")).toBe(30);
    expect(state.getUnitValue("second")).toBe(45);
  });

  it("getUnitLabel 返回单位名称", () => {
    expect(mountState().state.getUnitLabel("hour")).toBe("Hour");
    expect(mountState().state.getUnitLabel("meridiem")).toBe("AM/PM");
  });

  it("activeUnit 可读写", () => {
    const { state } = mountState();

    expect(state.activeUnit()).toBeUndefined();
    state.setActiveUnit("minute");
    expect(state.activeUnit()).toBe("minute");
    state.setActiveUnit(undefined);
    expect(state.activeUnit()).toBeUndefined();
  });
});

describe("createTimePickerState - 列注册表", () => {
  it("注册后可按单位取回元素", () => {
    const { state } = mountState();
    const element = document.createElement("div");

    state.registerColumn("hour", element);

    expect(state.getColumnElement("hour")).toBe(element);
    expect(state.getColumnElement("minute")).toBeUndefined();
  });

  it("注销只删除自己注册的那个元素，过期注销不影响新元素", () => {
    const { state } = mountState();
    const first = document.createElement("div");
    const second = document.createElement("div");

    const unregisterFirst = state.registerColumn("hour", first);
    const unregisterSecond = state.registerColumn("hour", second);

    unregisterFirst();
    expect(state.getColumnElement("hour")).toBe(second);

    unregisterSecond();
    expect(state.getColumnElement("hour")).toBeUndefined();
  });
});

describe("useTimePickerContext", () => {
  it("脱离 Provider 使用时抛错并带上组件名", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      render(() => {
        useTimePickerContext("TimePickerColumn");
        return <div />;
      }),
    ).toThrow("<TimePickerColumn> 必须渲染在 <TimePicker> 内部");

    spy.mockRestore();
  });
});
