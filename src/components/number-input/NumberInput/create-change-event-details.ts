import { createChangeEventDetails } from "~/utils";
import type {
  NumberInputChangeEventDetails,
  NumberInputChangeReason,
} from "./NumberInput.types";

/**
 * 构造 onValueChange 的事件详情(对齐 base-ui 的 `ChangeEventDetails`)。
 *
 * 实现在 `~/utils`,这里只固定 NumberInput 的 reason 类型。
 */
export function createNumberInputChangeEventDetails(
  reason: NumberInputChangeReason,
  event?: Event,
  trigger?: Element,
): NumberInputChangeEventDetails {
  return createChangeEventDetails(reason, event, trigger);
}
