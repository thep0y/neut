import { splitProps, type ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";
import { clsx } from "~/utils";
import type { AttachmentTriggerProps } from "./AttachmentTrigger.types";

/**
 * 覆盖整张卡片的触发器（默认渲染 <button>），位于操作区之下，
 * 因此操作按钮仍可独立点击/聚焦；可通过 `component` 换成 <a> 等。
 */
export const AttachmentTrigger = <T extends ValidComponent = "button">(
  props: AttachmentTriggerProps<T>,
) => {
  // class / classList 必须先摘出来：若直接 `{...props}` 再写 to显式 class，
  // Solid 会用 node.className = value 把 classList 加上的类整体覆盖掉。
  const [local, others] = splitProps(props as AttachmentTriggerProps, [
    "component",
    "class",
    "classList",
  ]);
  const component = (local.component as ValidComponent) ?? "button";
  const type =
    component === "button"
      ? ((props as { type?: "button" | "submit" | "reset" }).type ?? "button")
      : undefined;

  return (
    <Dynamic
      {...others}
      component={component}
      type={type}
      data-slot="attachment-trigger"
      class={clsx("absolute inset-0 z-10 outline-none", local.class)}
      classList={local.classList}
    />
  );
};
