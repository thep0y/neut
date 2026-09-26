import type { BaseProps } from "~/types";
import type { TimePickerUnit } from "../TimePicker/TimePicker.types";

export interface TimePickerColumnProps extends BaseProps {
  /** 该列对应的单位 */
  unit: TimePickerUnit;
  /** listbox 的 aria-label;缺省取单位名称(Hour/Minute/...) */
  label?: string;
}
