import { createChangeEventDetails as createSharedDetails } from "~/utils";
import type { ToggleGroupChangeEventDetails } from "./ToggleGroup.types";

/**
 * 构造 onValueChange 的事件详情(对齐 base-ui 的 `ChangeEventDetails`)。
 *
 * 实现已抽到 `~/utils` 的 `createChangeEventDetails`——`isCanceled` /
 * `isPropagationAllowed` 的 getter 语义是所有组件共用的关键细节,
 * 这里只做「补上 ToggleGroup 的 reason 类型」这一层。
 *
 * ToggleGroup 的 `event` 是必填(调用方 `toggleItem` 一定拿得到事件),
 * 而共享工厂的签名是可选,因此这里显式断言回必填类型,不放宽对外契约。
 */
export function createChangeEventDetails(
  event: Event,
  trigger?: Element,
): ToggleGroupChangeEventDetails {
  // ToggleGroup 的 reason 目前只有 "none"
  return createSharedDetails(
    "none",
    event,
    trigger,
  ) as ToggleGroupChangeEventDetails;
}
