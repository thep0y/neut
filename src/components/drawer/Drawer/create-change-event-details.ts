import type {
  DrawerChangeEventDetails,
  DrawerChangeReason,
} from "./Drawer.types";

/** 构造 onOpenChange 的第二个参数（对齐仓库既有 ChangeEventDetails 语义） */
export function createDrawerChangeEventDetails(
  reason: DrawerChangeReason,
  event?: Event,
  trigger?: Element,
): DrawerChangeEventDetails {
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
