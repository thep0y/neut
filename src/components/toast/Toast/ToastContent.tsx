import { Show } from "solid-js";
import { clsx } from "~/utils";
import type { ToastT } from "./Toast.types";
import { resolveToastContent } from "./Toast.utils";

/**
 * 标题 + 描述。两者都支持惰性函数（内容可能随信号变化），
 * 求值统一走 `resolveToastContent`；描述为空时整块不渲染。
 */
export function ToastContent(props: { toast: ToastT }) {
  return (
    <div
      data-slot="toast-content"
      class={clsx(
        "flex min-w-0 flex-1 flex-col gap-0.5",
        props.toast.classes?.content,
      )}
    >
      <div
        data-slot="toast-title"
        class={clsx(
          "text-sm font-medium leading-snug",
          props.toast.classes?.title,
        )}
      >
        {resolveToastContent(props.toast.title)}
      </div>
      <Show when={props.toast.description}>
        <div
          data-slot="toast-description"
          class={clsx(
            "text-sm leading-relaxed text-muted-foreground",
            props.toast.descriptionClass,
            props.toast.classes?.description,
          )}
        >
          {resolveToastContent(props.toast.description)}
        </div>
      </Show>
    </div>
  );
}
