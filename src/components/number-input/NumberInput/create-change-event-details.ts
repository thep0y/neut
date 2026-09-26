import type {
  NumberInputChangeEventDetails,
  NumberInputChangeReason,
} from "./NumberInput.types";

/**
 * 构造 onValueChange 的事件详情(对齐 base-ui 的 `ChangeEventDetails`)。
 *
 * `isCanceled` / `isPropagationAllowed` 用 getter 暴露:回调内部可以即时读到
 * `cancel()` / `allowPropagation()` 之后的最新值,而不是创建时的快照。
 */
export function createNumberInputChangeEventDetails(
  reason: NumberInputChangeReason,
  event?: Event,
  trigger?: Element,
): NumberInputChangeEventDetails {
  let canceled = false;
  let propagationAllowed = false;

  return {
    reason,
    event,
    trigger,
    cancel: () => {
      canceled = true;
    },
    allowPropagation: () => {
      propagationAllowed = true;
    },
    get isCanceled() {
      return canceled;
    },
    get isPropagationAllowed() {
      return propagationAllowed;
    },
  };
}
