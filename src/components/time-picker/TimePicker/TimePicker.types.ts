import type { Accessor, ParentProps } from "solid-js";

/** 12 小时制 / 24 小时制 */
export type TimePickerHourCycle = 12 | 24;

/**
 * 面板里的一个可选单位列。
 * 12 小时制会额外出现 `meridiem`(AM/PM)列,`showSeconds` 决定是否出现 `second` 列。
 */
export type TimePickerUnit = "hour" | "minute" | "second" | "meridiem";

export type TimePickerMeridiem = "AM" | "PM";

/** 单位列里一项的值:小时/分钟/秒是数字,meridiem 是 AM/PM */
export type TimePickerUnitValue = number | TimePickerMeridiem;

/** 对齐仓库既有 ChangeEventDetails 的 reason 取值 */
export type TimePickerChangeReason =
  | "option-press"
  | "keyboard"
  | "clear"
  | "input"
  | "none";

export interface TimePickerOptionMeta {
  value: TimePickerUnitValue;
  label: string;
}

/**
 * onValueChange 的第二个参数,语义对齐 base-ui 的 `ChangeEventDetails`。
 *
 * - `cancel()`:在回调里阻止组件提交本次变更(受控模式下状态由外部决定,组件本就不提交)
 * - `allowPropagation()`:API 对齐保留;本实现不主动阻止事件传播,因此是空操作
 */
export interface TimePickerChangeEventDetails {
  reason: TimePickerChangeReason;
  event?: Event;
  trigger?: Element;
  cancel: () => void;
  allowPropagation: () => void;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
}

/** 提交某个单位列选择时的附加信息 */
export interface TimePickerCommitOptions {
  reason?: TimePickerChangeReason;
  event?: Event;
  trigger?: Element;
}

export interface TimePickerProps extends ParentProps {
  /** 受控选中时间;不传则内部自管理(非受控模式) */
  value?: Date;
  /** 非受控模式下的初始选中时间 */
  defaultValue?: Date;
  onValueChange?: (
    value: Date | undefined,
    details: TimePickerChangeEventDetails,
  ) => void;
  /** 小时制,默认 24 */
  hourCycle?: TimePickerHourCycle;
  /** 是否显示秒列,默认 false */
  showSeconds?: boolean;
  /** 小时列步长,默认 1 */
  hourStep?: number;
  /** 分钟列步长(如 15 → :00/:15/:30/:45),默认 1 */
  minuteStep?: number;
  /** 秒列步长,默认 1 */
  secondStep?: number;
  /** 传给 Intl 的 locale(影响 AM/PM 文案) */
  locale?: string;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  /** 自定义触发器里的时间格式化;默认 24 小时制输出 "HH:mm[:ss]" */
  formatTime?: (date: Date) => string;
  /** 阅读方向,影响左右方向键在列之间的移动;默认 ltr */
  dir?: "ltr" | "rtl" | "auto";
  /** 受控打开状态 */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /**
   * 是否为 modal:打开期间锁定页面滚动、拦截浮层之外的滚轮/触摸滚动。
   * 默认 true(时间选择通常不应带着页面一起滚)。对齐 Base UI Popover 的 modal 语义。
   */
  modal?: boolean;
}

export interface TimePickerContextValue {
  value: Accessor<Date | undefined>;
  /** 选中某个单位列的一项,合并进当前值并派发 onValueChange */
  setUnitValue: (
    unit: TimePickerUnit,
    value: TimePickerUnitValue,
    options?: TimePickerCommitOptions,
  ) => void;
  hourCycle: Accessor<TimePickerHourCycle>;
  showSeconds: Accessor<boolean>;
  /** 当前需要渲染的列(按顺序) */
  units: Accessor<TimePickerUnit[]>;
  disabled: Accessor<boolean>;
  readOnly: Accessor<boolean>;
  placeholder: Accessor<string | undefined>;
  dir: Accessor<"ltr" | "rtl" | "auto" | undefined>;
  /** 格式化当前值供触发器展示 */
  formatTime: (date: Date) => string;
  getOptions: (unit: TimePickerUnit) => TimePickerOptionMeta[];
  getUnitValue: (unit: TimePickerUnit) => TimePickerUnitValue | undefined;
  getUnitLabel: (unit: TimePickerUnit) => string;
  activeUnit: Accessor<TimePickerUnit | undefined>;
  setActiveUnit: (unit: TimePickerUnit | undefined) => void;
  /** 列挂载时注册自己的 DOM 元素(供跨列方向键聚焦),返回注销函数 */
  registerColumn: (unit: TimePickerUnit, element: HTMLElement) => () => void;
  getColumnElement: (unit: TimePickerUnit) => HTMLElement | undefined;
}
