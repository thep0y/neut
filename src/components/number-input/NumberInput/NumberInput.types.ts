import type { BaseProps } from "~/types";

export type NumberInputChangeReason =
  | "input"
  | "button-press"
  | "keyboard"
  | "blur"
  | "none";

/**
 * onValueChange 的第二个参数,语义对齐仓库既有的 `ChangeEventDetails`。
 *
 * - `cancel()`:阻止组件提交本次变更(受控模式下状态由外部决定,组件本就不提交)
 * - `allowPropagation()`:API 对齐保留;本实现不主动阻止事件传播,因此是空操作
 */
export interface NumberInputChangeEventDetails {
  reason: NumberInputChangeReason;
  event?: Event;
  trigger?: Element;
  cancel: () => void;
  allowPropagation: () => void;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
}

export interface NumberInputProps extends BaseProps {
  /** 受控数值;不传则内部自管理(非受控模式)。null 表示空值 */
  value?: number | null;
  /** 非受控模式下的初始数值 */
  defaultValue?: number | null;
  onValueChange?: (
    value: number | null,
    details: NumberInputChangeEventDetails,
  ) => void;
  min?: number;
  max?: number;
  /** 按钮/方向键步长,默认 1 */
  step?: number;
  /** PageUp/PageDown 步长,默认 step * 10 */
  largeStep?: number;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  name?: string;
  placeholder?: string;
  id?: string;
  "aria-label"?: string;
  /** 自定义格式化(用于失焦/步进后回显),默认 String(value) */
  format?: (value: number) => string;
  /** 自定义解析;解析失败返回 null,默认接受十进制文本 */
  parse?: (text: string) => number | null;
}
