import {
  Show,
  type JSX,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  splitProps,
} from "solid-js";
import {
  CircleCheck,
  CircleX,
  Info,
  LoaderCircle,
  TriangleAlert,
  X,
} from "lucide-solid";
import { clsx } from "~/utils";
import { toastIconVariants, toastVariants } from "./Toast.styles";
import {
  isAction,
  type ToastIcons,
  type ToastProps,
  type ToastTypes,
} from "./Toast.types";
import {
  getAnimationClasses,
  getToastAction,
  getToastStyle,
  resolveToastContent,
} from "./Toast.utils";
import { ToastActionButton } from "./ToastActionButton";

const TOAST_LIFETIME = 4000;
const EXIT_ANIMATION_MS = 200;

function getDefaultIcon(type: ToastTypes) {
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

  const [animationState, setAnimationState] = createSignal<"open" | "closed">(
    "closed",
  );

  const toast = () => local.toast;
  const toastType = createMemo(() => toast().type ?? "default");
  const richColors = createMemo(
    () => toast().richColors ?? local.defaultRichColors ?? false,
  );
  const dismissible = createMemo(() => toast().dismissible !== false);
  const isBusy = createMemo(() => toastType() === "loading");

  onMount(() => {
    const raf = requestAnimationFrame(() => setAnimationState("open"));
    onCleanup(() => cancelAnimationFrame(raf));
  });

  const close = () => {
    if (animationState() !== "open") return;
    setAnimationState("closed");
    toast().onDismiss?.(toast());
    setTimeout(() => local.onRemove(toast().id), EXIT_ANIMATION_MS);
  };

  // 外部 dismiss：把 delete 标记转换成退场动画
  createEffect(() => {
    if (toast().delete && animationState() === "open") {
      close();
    }
  });

  // 自动关闭计时器
  createEffect(() => {
    const current = toast();
    if (
      current.delete ||
      current.type === "loading" ||
      current.duration === Infinity ||
      current.duration === 0
    ) {
      return;
    }

    const delay = current.duration ?? local.duration ?? TOAST_LIFETIME;
    const timer = setTimeout(() => {
      current.onAutoClose?.(current);
      close();
    }, delay);

    onCleanup(() => clearTimeout(timer));
  });

  const icon = () => {
    if (toast().icon !== undefined) return toast().icon;
    return (
      local.icons?.[toastType() as keyof ToastIcons] ??
      getDefaultIcon(toastType())
    );
  };

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
          <>
            <Show when={icon()}>
              <div
                data-slot="toast-icon"
                class={clsx(
                  toastIconVariants({ type: toastType() }),
                  toast().classes?.icon,
                )}
              >
                {icon()}
              </div>
            </Show>

            <div
              data-slot="toast-content"
              class={clsx(
                "flex min-w-0 flex-1 flex-col gap-0.5",
                toast().classes?.content,
              )}
            >
              <div
                data-slot="toast-title"
                class={clsx(
                  "text-sm font-medium leading-snug",
                  toast().classes?.title,
                )}
              >
                {resolveToastContent(toast().title)}
              </div>
              <Show when={toast().description}>
                <div
                  data-slot="toast-description"
                  class={clsx(
                    "text-sm leading-relaxed text-muted-foreground",
                    toast().descriptionClass,
                    toast().classes?.description,
                  )}
                >
                  {resolveToastContent(toast().description)}
                </div>
              </Show>
            </div>

            <Show when={getToastAction(toast().action)}>
              {(action) => (
                <ToastActionButton
                  action={action()}
                  variant="action"
                  class={toast().classes?.actionButton}
                  onClose={close}
                />
              )}
            </Show>

            <Show when={getToastAction(toast().cancel)}>
              {(cancel) => (
                <ToastActionButton
                  action={cancel()}
                  variant="cancel"
                  class={toast().classes?.cancelButton}
                  onClose={close}
                />
              )}
            </Show>

            <Show when={toast().action && !isAction(toast().action)}>
              {toast().action as JSX.Element}
            </Show>
            <Show when={toast().cancel && !isAction(toast().cancel)}>
              {toast().cancel as JSX.Element}
            </Show>

            <Show when={local.closeButton && dismissible() && !isBusy()}>
              <button
                type="button"
                data-slot="toast-close"
                aria-label={local.closeButtonAriaLabel ?? "Close toast"}
                class={clsx(
                  "absolute top-2.5 right-2.5 flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground",
                  toast().classes?.closeButton,
                )}
                onClick={close}
              >
                <X class="size-3.5" />
              </button>
            </Show>
          </>
        }
      >
        {toast().jsx}
      </Show>
    </li>
  );
}
