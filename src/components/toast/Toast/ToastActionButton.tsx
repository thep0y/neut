import type { JSX } from "solid-js";
import { clsx } from "~/utils";
import type { Action } from "./Toast.types";

export interface ToastActionButtonProps {
  /** 已经收窄过的操作对象 */
  action: Action;
  /** action 与 cancel 共用同一套按钮行为，仅插槽名与配色不同 */
  variant: "action" | "cancel";
  class?: string;
  onClose: () => void;
}

const VARIANT_CLASS: Record<ToastActionButtonProps["variant"], string> = {
  action: "bg-foreground text-background hover:bg-foreground/80",
  cancel: "bg-foreground/10 text-foreground hover:bg-foreground/15",
};

/**
 * toast 上的"操作/取消"按钮：一个职责——把点击派发给 `action.onClick`，
 * 并在调用方没有 `preventDefault()` 时请求关闭。
 * 关闭本身由 `onClose` 注入，按钮不碰 toast 的生命周期状态。
 */
export function ToastActionButton(props: ToastActionButtonProps): JSX.Element {
  const isAction = () => props.variant === "action";

  return (
    <button
      type="button"
      data-slot={isAction() ? "toast-action" : "toast-cancel"}
      class={clsx(
        "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium outline-none transition-colors",
        VARIANT_CLASS[props.variant],
        props.class,
      )}
      onClick={(event) => {
        props.action.onClick?.(event);
        if (!event.defaultPrevented) props.onClose();
      }}
    >
      {props.action.label}
    </button>
  );
}
