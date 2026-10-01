import { createChangeEventDetails } from "~/utils";
import type {
  TimePickerChangeEventDetails,
  TimePickerChangeReason,
} from "./TimePicker.types";

/**
 * 构造 onValueChange 的事件详情(对齐 base-ui 的 `ChangeEventDetails`)。
 *
 * 实现在 `~/utils`,这里只固定 TimePicker 的 reason 类型。
 */
export function createTimePickerChangeEventDetails(
  reason: TimePickerChangeReason,
  event?: Event,
  trigger?: Element,
): TimePickerChangeEventDetails {
  return createChangeEventDetails(reason, event, trigger);
}
