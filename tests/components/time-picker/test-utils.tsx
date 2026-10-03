import { createSignal } from "solid-js";
import type {
  TimePickerCommitOptions,
  TimePickerContextValue,
  TimePickerHourCycle,
  TimePickerOptionMeta,
  TimePickerUnit,
  TimePickerUnitValue,
} from "~/components/time-picker/TimePicker/TimePicker.types";

/**
 * TimePicker 子组件测试脚手架：一份**假的 ContextValue**。
 *
 * TimePickerColumn / TimePickerContent 的输入全部来自 `TimePickerContext`，
 * 直接用真组件拼装很难构造"空单元列""值不在步长上"等边界；这里按
 * TESTING.md §4.5 的做法（"测 hook 时给它一个假的 ContextValue"）
 * 提供一个可控实现，只在测试里使用。
 */

/** 一次 `setUnitValue` 调用，供断言 reason / event / trigger 与最终值 */
export interface TimePickerCommitCall {
  unit: TimePickerUnit;
  value: TimePickerUnitValue;
  options: TimePickerCommitOptions | undefined;
}

export interface FakeTimePickerContextOptions {
  /** 要渲染的列；默认 hour + minute */
  units?: TimePickerUnit[];
  /** 各列选项；缺省为空数组 */
  options?: Partial<Record<TimePickerUnit, TimePickerOptionMeta[]>>;
  dir?: "ltr" | "rtl" | "auto";
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  value?: Date;
  hourCycle?: TimePickerHourCycle;
  formatTime?: (date: Date) => string;
  getUnitLabel?: (unit: TimePickerUnit) => string;
}

export interface FakeTimePickerContext {
  ctx: TimePickerContextValue;
  /** 记录子组件提交的所有选择 */
  commits: TimePickerCommitCall[];
  /** 直接改某列的当前值，用于驱动"外部值变化"（滚动入视等 effect） */
  setSelected: (unit: TimePickerUnit, value: TimePickerUnitValue) => void;
}

export function createFakeTimePickerContext(
  options: FakeTimePickerContextOptions = {},
): FakeTimePickerContext {
  const [activeUnit, setActiveUnit] = createSignal<
    TimePickerUnit | undefined
  >();
  const [values, setValues] = createSignal<
    Partial<Record<TimePickerUnit, TimePickerUnitValue>>
  >({});
  const columns = new Map<TimePickerUnit, HTMLElement>();
  const commits: TimePickerCommitCall[] = [];

  const ctx: TimePickerContextValue = {
    value: () => options.value,
    setUnitValue: (unit, value, commitOptions) => {
      commits.push({ unit, value, options: commitOptions });
      setValues((prev) => ({ ...prev, [unit]: value }));
    },
    hourCycle: () => options.hourCycle ?? 24,
    showSeconds: () => false,
    units: () => options.units ?? ["hour", "minute"],
    disabled: () => options.disabled === true,
    readOnly: () => options.readOnly === true,
    placeholder: () => options.placeholder,
    dir: () => options.dir,
    formatTime: (date) =>
      options.formatTime ? options.formatTime(date) : String(date),
    getOptions: (unit) => options.options?.[unit] ?? [],
    getUnitValue: (unit) => values()[unit],
    getUnitLabel: (unit) => options.getUnitLabel?.(unit) ?? unit,
    activeUnit,
    setActiveUnit,
    registerColumn: (unit, element) => {
      columns.set(unit, element);
      return () => {
        if (columns.get(unit) === element) columns.delete(unit);
      };
    },
    getColumnElement: (unit) => columns.get(unit),
  };

  return {
    ctx,
    commits,
    setSelected: (unit, value) =>
      setValues((prev) => ({ ...prev, [unit]: value })),
  };
}

/** 常用选项表：hour=0..2、minute=0..2，便于断言"推进/回绕"的具体结果 */
export function smallOptions(): Partial<
  Record<TimePickerUnit, TimePickerOptionMeta[]>
> {
  return {
    hour: [
      { value: 0, label: "00" },
      { value: 1, label: "01" },
      { value: 2, label: "02" },
    ],
    minute: [
      { value: 0, label: "00" },
      { value: 15, label: "15" },
    ],
  };
}
