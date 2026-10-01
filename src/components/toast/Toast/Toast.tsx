import { Show, createMemo, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { toastVariants } from "./Toast.styles";
import type { ToastIcons, ToastProps, ToastT } from "./Toast.types";
import { getAnimationClasses, getToastStyle } from "./Toast.utils";
import { ToastActions } from "./ToastActions";
import { ToastCloseButton, isCloseButtonVisible } from "./ToastCloseButton";
import { ToastContent } from "./ToastContent";
import { ToastIcon } from "./ToastIcon";
import { useToastLifecycle } from "./useToastLifecycle";

/**
 * 单条 toast 的骨架：状态属性（data-*）+ 尺寸/层叠样式 + 四个插槽。
 *
 * 渲染层只做组合，具体内容分别由
 * `ToastIcon` / `ToastContent` / `ToastActions` / `ToastCloseButton` 承担，
 * 进出场与自动关闭由 `useToastLifecycle` 承担。
 */
export function Toast(props: ToastProps) {
  const [local] = splitProps(props, [
    "toast",
    "closeButton",
    "duration",
    "class",
    "icons",
    "closeButtonAriaLabel",
    "defaultRichColors",
    "onRemove",
    "index",
    "total",
    "expanded",
    "position",
    "gap",
  ]);

  const toast = () => local.toast;
  const toastType = createMemo(() => toast().type ?? "default");
  const richColors = createMemo(
    () => toast().richColors ?? local.defaultRichColors ?? false,
  );

  const { animationState, close } = useToastLifecycle({
    toast,
    duration: () => local.duration,
    onRemove: (id) => local.onRemove(id),
  });

  const toastStyle = () =>
    getToastStyle({
      toast: toast(),
      index: local.index,
      total: local.total,
      expanded: local.expanded,
      position: local.position,
      gap: local.gap,
    });

  const animationClasses = () =>
    getAnimationClasses({
      index: local.index,
      expanded: local.expanded,
      position: local.position,
    });

  return (
    <li
      data-slot="toast"
      data-type={toastType()}
      data-state={animationState()}
      data-rich-colors={richColors()}
      data-testid={toast().testId}
      class={clsx(
        toastVariants({ type: toastType() }),
        local.closeButton && "pr-8",
        animationClasses(),
        local.class,
        toast().class,
        toast().classes?.toast,
        toast().classes?.[toastType()],
      )}
      style={toastStyle()}
    >
      <Show
        when={toast().jsx}
        fallback={
          <ToastBody
            toast={toast()}
            icons={local.icons}
            closeButton={local.closeButton}
            closeButtonAriaLabel={local.closeButtonAriaLabel}
            onClose={close}
          />
        }
      >
        {toast().jsx}
      </Show>
    </li>
  );
}

/** 默认内容布局：图标 / 文案 / 操作 / 关闭按钮（依次排布，各自独立） */
function ToastBody(props: {
  toast: ToastT;
  icons?: ToastIcons;
  closeButton: boolean;
  closeButtonAriaLabel?: string;
  onClose: () => void;
}) {
  return (
    <>
      <ToastIcon toast={props.toast} icons={props.icons} />
      <ToastContent toast={props.toast} />
      <ToastActions toast={props.toast} onClose={props.onClose} />
      <Show when={isCloseButtonVisible(props.toast, props.closeButton)}>
        <ToastCloseButton
          ariaLabel={props.closeButtonAriaLabel}
          class={props.toast.classes?.closeButton}
          onClose={props.onClose}
        />
      </Show>
    </>
  );
}
