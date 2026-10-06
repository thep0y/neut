import { createChangeEventDetails } from "~/utils";
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
  return createChangeEventDetails(reason, event, trigger);
}
