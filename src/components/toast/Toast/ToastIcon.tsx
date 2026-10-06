import { Show, type JSX } from "solid-js";
import {
  CircleCheck,
  CircleX,
  Info,
  LoaderCircle,
  TriangleAlert,
} from "lucide-solid";
import { clsx } from "~/utils";
import { toastIconVariants } from "./Toast.styles";
import type { ToastIcons, ToastT, ToastTypes } from "./Toast.types";

/** 内置图标：类型 → lucide 图标；`default` 没有内置图标 */
export function getDefaultIcon(type: ToastTypes): JSX.Element {
  switch (type) {
    case "success":
      return <CircleCheck />;
    case "info":
      return <Info />;
    case "warning":
      return <TriangleAlert />;
    case "error":
      return <CircleX />;
    case "loading":
      return <LoaderCircle class="animate-spin" />;
    default:
      return undefined;
  }
}

/** 图标优先级：单条 toast 自带的 `icon` > Toaster 的 `icons` 映射 > 内置图标 */
export function resolveToastIcon(
  toast: ToastT,
  icons?: ToastIcons,
): JSX.Element {
  const type = toast.type ?? "default";
  if (toast.icon !== undefined) return toast.icon;
  return icons?.[type as keyof ToastIcons] ?? getDefaultIcon(type);
}

/**
 * 图标槽位：只负责"展示哪个图标"和它的容器类名，不参与任何布局/生命周期决策。
 * 没有图标时整块不渲染，避免占位。
 */
export function ToastIcon(props: { toast: ToastT; icons?: ToastIcons }) {
  return (
    <Show when={resolveToastIcon(props.toast, props.icons)}>
      <div
        data-slot="toast-icon"
        class={clsx(
          toastIconVariants({ type: props.toast.type ?? "default" }),
          props.toast.classes?.icon,
        )}
      >
        {resolveToastIcon(props.toast, props.icons)}
      </div>
    </Show>
  );
}
