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

/**
 * 与 Button 的 xs 尺寸共用同一组度量（h-6 / px-2 / text-xs / 小圆角），
 * 配色也回到 `primary` / `secondary` 语义 token，不再用"前景色反色"那套。
 */
const VARIANT_CLASS: Record<ToastActionButtonProps["variant"], string> = {
  action: "bg-primary text-primary-foreground hover:bg-primary/80",
  cancel: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
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
        "h-6 shrink-0 rounded-[min(var(--radius-md),10px)] px-2 text-xs font-medium outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
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
