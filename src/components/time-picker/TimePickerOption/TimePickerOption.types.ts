import type { JSX } from "solid-js";
import type { BaseProps, MouseEventHandler } from "~/types";
import type { TimePickerUnitValue } from "../TimePicker/TimePicker.types";

export interface TimePickerOptionProps extends BaseProps {
  value: TimePickerUnitValue;
  id?: string;
  selected?: boolean;
  disabled?: boolean;
  children?: JSX.Element;
  onSelect?: MouseEventHandler<"div">;
}
