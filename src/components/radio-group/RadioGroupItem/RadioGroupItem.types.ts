import type { BaseProps } from "~/types";

export interface RadioGroupItemProps extends BaseProps {
  /** 当前 radio 的值，必须与 RadioGroup 的 value 进行比较 */
  value: string;
  disabled?: boolean;
  id?: string;
  /** 透传给原生 button 的其余属性，例如 aria-invalid、dir 等 */
  [key: string]: any;
}
