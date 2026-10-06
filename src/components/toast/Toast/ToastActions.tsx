import { Show, type JSX } from "solid-js";
import { isAction, type ToastT } from "./Toast.types";
import { getToastAction } from "./Toast.utils";
import { ToastActionButton } from "./ToastActionButton";

/**
 * toast 的操作区：`action` 与 `cancel` 各自既可以是"带 label 的操作对象"，
 * 也可以是任意自定义元素。两种形态互斥，因此这里成对处理：
 * - 操作对象 → 复用 `ToastActionButton`（关闭语义由 `onClose` 注入）；
 * - 自定义元素 → 原样渲染，不附加任何行为。
 */
export function ToastActions(props: { toast: ToastT; onClose: () => void }) {
  const action = () => props.toast.action;
  const cancel = () => props.toast.cancel;

  return (
    <>
      <Show when={getToastAction(action())}>
        {(entry) => (
          <ToastActionButton
            action={entry()}
            variant="action"
            class={props.toast.classes?.actionButton}
            onClose={props.onClose}
          />
        )}
      </Show>

      <Show when={getToastAction(cancel())}>
        {(entry) => (
          <ToastActionButton
            action={entry()}
            variant="cancel"
            class={props.toast.classes?.cancelButton}
            onClose={props.onClose}
          />
        )}
      </Show>

      <Show when={action() && !isAction(action())}>
        {action() as JSX.Element}
      </Show>
      <Show when={cancel() && !isAction(cancel())}>
        {cancel() as JSX.Element}
      </Show>
    </>
  );
}
