import { clsx } from "~/utils";
import { X } from "lucide-solid";
import type { ToastT } from "./Toast.types";

/**
 * 关闭按钮。只负责"长什么样 + 报告点击"，是否显示、点了之后做什么
 * 都由调用方决定（关闭本身属于生命周期，不在渲染层）。
 */
export function ToastCloseButton(props: {
  ariaLabel?: string;
  class?: string;
  onClose: () => void;
}) {
  return (
    <button
      type="button"
      data-slot="toast-close"
      aria-label={props.ariaLabel ?? "Close toast"}
      class={clsx(
        "absolute top-2.5 right-2.5 flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground",
        props.class,
      )}
      onClick={(): void => props.onClose()}
    >
      <X class="size-3.5" />
    </button>
  );
}

/** 关闭按钮的可见性：显式开启、可关闭、且不是常驻的 loading */
export function isCloseButtonVisible(
  toast: ToastT,
  closeButton: boolean,
): boolean {
  const type = toast.type ?? "default";
  return closeButton && toast.dismissible !== false && type !== "loading";
}
