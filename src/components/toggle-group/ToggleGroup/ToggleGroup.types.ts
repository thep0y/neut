import type { VariantProps } from "class-variance-authority";
import type { Accessor } from "solid-js";
import type { toggleVariants } from "~/components/toggle/Toggle/Toggle.styles";
import type { BaseProps, PolymorphicProps } from "~/types";

/** item 的 variant / size 取值直接取自 toggleVariants,避免多处维护 */
export type ToggleGroupVariant = NonNullable<
  VariantProps<typeof toggleVariants>["variant"]
>;
export type ToggleGroupSize = NonNullable<
  VariantProps<typeof toggleVariants>["size"]
>;

export type ToggleGroupOrientation = "horizontal" | "vertical";

/** 对齐 base-ui:ToggleGroup 的 change reason 目前只有 "none" */
export type ToggleGroupChangeEventReason = "none";

/**
 * onValueChange 的第二个参数,语义对齐 base-ui 的 `ToggleGroup.ChangeEventDetails`。
 *
 * - `cancel()`:阻止组件提交本次变更(受控模式下状态由外部决定,组件本就不提交)
 * - `allowPropagation()`:API 对齐保留;本实现不主动阻止事件传播,因此是空操作
 */
export interface ToggleGroupChangeEventDetails {
  reason: ToggleGroupChangeEventReason;
  event: Event;
  cancel: () => void;
  allowPropagation: () => void;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
  trigger: Element | undefined;
}

interface BaseToggleGroupProps extends BaseProps {
  /** 受控选中值(数组);不传则内部自管理 */
  value?: readonly string[];
  /** 非受控模式下的初始选中值 */
  defaultValue?: readonly string[];
  /** 选中值变化回调(受控与非受控都会触发) */
  onValueChange?: (
    value: string[],
    eventDetails: ToggleGroupChangeEventDetails,
  ) => void;
  /** 是否允许同时选中多个,默认 false;单选时再次点击会取消选中(对齐 base-ui) */
  multiple?: boolean;
  /** 整组禁用,item 会继承该状态 */
  disabled?: boolean;
  /** 布局方向,默认 "horizontal";同时决定方向键映射与排列方向 */
  orientation?: ToggleGroupOrientation;
  /** 方向键到达边界时是否循环回另一端,默认 true */
  loopFocus?: boolean;
  /**
   * item 之间的间距,通过根元素上的 `--gap` 变量实现,默认 2(对齐 shadcn)。
   * 传 0 时相邻 item 拼接为一个整体(仅首尾保留圆角与边框)。
   */
  spacing?: number;
  /** 组级 variant,item 未单独指定时继承 */
  variant?: ToggleGroupVariant;
  /** 组级 size,item 未单独指定时继承 */
  size?: ToggleGroupSize;
}

export type ToggleGroupProps = PolymorphicProps<
  "div",
  BaseToggleGroupProps,
  false
>;

/** 已注册的 item,供 roving focus 与键盘导航使用 */
export interface ToggleGroupItemEntry {
  value: string;
  element: HTMLElement;
  /** accessor,支持运行时 disabled 翻转 */
  disabled: () => boolean;
}

export interface ToggleGroupContextValue {
  /** 当前选中值(受控优先,否则内部状态) */
  value: Accessor<readonly string[]>;
  multiple: Accessor<boolean>;
  disabled: Accessor<boolean>;
  orientation: Accessor<ToggleGroupOrientation>;
  loopFocus: Accessor<boolean>;
  dir: Accessor<"ltr" | "rtl" | "auto" | undefined>;
  spacing: Accessor<number>;
  /** 组级 variant / size;未显式指定时为 undefined,便于 item 单独覆盖 */
  variant: Accessor<ToggleGroupVariant | undefined>;
  size: Accessor<ToggleGroupSize | undefined>;
  /** 该 value 当前是否处于按下状态 */
  isPressed: (value: string) => boolean;
  /** 切换某个 item 的按下状态,并派发 onValueChange(value, details) */
  toggleItem: (value: string, event: Event, trigger?: Element) => void;
  /** 当前焦点高亮的 item(roving focus 的 tabindex 起点) */
  highlightedValue: Accessor<string | undefined>;
  setHighlightedValue: (value: string) => void;
  /** 按挂载顺序注册 item,返回注销函数 */
  registerItem: (entry: ToggleGroupItemEntry) => () => void;
  /** 已注册的 item 列表(挂载顺序) */
  getItems: () => ToggleGroupItemEntry[];
  /** 高亮缺失时,该 value 是否为第一个可用 item(tabindex 起点) */
  isFirstEnabled: (value: string) => boolean;
  /** 该 value 对应的 item 当前是否可用(已注册且未 disabled) */
  isUsable: (value: string) => boolean;
}
