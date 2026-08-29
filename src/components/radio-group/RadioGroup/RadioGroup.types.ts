import type { Accessor, ParentProps } from "solid-js";
import type { BaseProps } from "~/types";

export interface RadioGroupProps extends BaseProps, ParentProps {
  /** 受控选中值；不传则内部自管理（非受控模式） */
  value?: string;
  /** 非受控模式下的初始选中值 */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  /** 原生 radio input 的 name，便于表单提交 */
  name?: string;
}

export interface RadioGroupContextValue {
  value: Accessor<string | undefined>;
  setValue: (value: string) => void;
  disabled: Accessor<boolean>;
  name?: string;
  /** RadioGroupItem 挂载时注册自己的 DOM 元素，返回取消注册函数 */
  registerItem: (value: string, element: HTMLElement) => () => void;
  /** 把焦点移动到指定 value 的 item 上 */
  focusItem: (value: string) => void;
}
