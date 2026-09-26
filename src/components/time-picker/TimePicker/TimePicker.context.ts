import { createContext, createSignal, useContext } from "solid-js";
import { createTimePickerChangeEventDetails } from "./create-change-event-details";
import {
  formatTime as formatTimeValue,
  getUnitLabel,
  getUnitOptions,
  getUnitValue as getUnitValueFromDate,
  getUnits,
  type TimePickerConfig,
  withUnit,
} from "./time-picker.utils";
import type {
  TimePickerChangeEventDetails,
  TimePickerContextValue,
  TimePickerHourCycle,
  TimePickerUnit,
} from "./TimePicker.types";

/** createTimePickerState 的输入:TimePickerProps 的运行时形态 */
export interface TimePickerStateProps {
  value?: Date;
  defaultValue?: Date;
  onValueChange?: (
    value: Date | undefined,
    details: TimePickerChangeEventDetails,
  ) => void;
  hourCycle?: TimePickerHourCycle;
  showSeconds?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  locale?: string;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  formatTime?: (date: Date) => string;
  dir?: "ltr" | "rtl" | "auto";
}

/**
 * TimePicker 的唯一状态源:选中时间(受控/非受控)与列交互所需的派生数据。
 *
 * 传入的 `props` 是响应式代理(直接传根组件的 props 或 splitProps 结果),
 * 所有 accessor 读取到的都是最新值。组件根只负责组装 Provider,
 * 时间换算等纯逻辑收敛在 time-picker.utils.ts。
 */
export function createTimePickerState(
  props: TimePickerStateProps,
): TimePickerContextValue {
  const [internalValue, setInternalValue] = createSignal<Date | undefined>(
    props.defaultValue,
  );
  const isControlled = () => props.value !== undefined;
  const value = () => (isControlled() ? props.value : internalValue());

  // 无值时以组件创建时刻为基准:只改被操作的字段,其余字段(含日期)保持
  const baseDate = new Date();

  const hourCycle = (): TimePickerHourCycle => props.hourCycle ?? 24;
  const showSeconds = () => props.showSeconds === true;

  const config = (): TimePickerConfig => ({
    hourCycle: hourCycle(),
    showSeconds: showSeconds(),
    hourStep: props.hourStep ?? 1,
    minuteStep: props.minuteStep ?? 1,
    secondStep: props.secondStep ?? 1,
    locale: props.locale,
  });

  const units = () => getUnits(config());

  const [activeUnit, setActiveUnit] = createSignal<
    TimePickerUnit | undefined
  >();
  const columnElements = new Map<TimePickerUnit, HTMLElement>();

  const setUnitValue: TimePickerContextValue["setUnitValue"] = (
    unit,
    unitValue,
    options,
  ) => {
    if (props.disabled || props.readOnly) return;
    const current = value() ?? baseDate;
    const next = withUnit(current, unit, unitValue, hourCycle());

    // 先通知外部:onValueChange 中 cancel() 可阻止组件提交本次变更
    const details = createTimePickerChangeEventDetails(
      options?.reason ?? "none",
      options?.event,
      options?.trigger,
    );
    props.onValueChange?.(next, details);
    if (details.isCanceled) return;

    if (!isControlled()) setInternalValue(next);
  };

  return {
    value,
    setUnitValue,
    hourCycle,
    showSeconds,
    units,
    disabled: () => props.disabled === true,
    readOnly: () => props.readOnly === true,
    placeholder: () => props.placeholder,
    dir: () => props.dir,
    formatTime: (date) =>
      props.formatTime
        ? props.formatTime(date)
        : formatTimeValue(date, config()),
    getOptions: (unit) => getUnitOptions(unit, config()),
    getUnitValue: (unit) => getUnitValueFromDate(value(), unit, hourCycle()),
    getUnitLabel,
    activeUnit,
    setActiveUnit,
    registerColumn: (unit, element) => {
      columnElements.set(unit, element);
      return () => {
        if (columnElements.get(unit) === element) columnElements.delete(unit);
      };
    },
    getColumnElement: (unit) => columnElements.get(unit),
  };
}

const TimePickerContext = createContext<TimePickerContextValue>();

export function useTimePickerContext(
  component: string,
): TimePickerContextValue {
  const ctx = useContext(TimePickerContext);
  if (!ctx) {
    throw new Error(`<${component}> 必须渲染在 <TimePicker> 内部`);
  }
  return ctx;
}

export { TimePickerContext };
