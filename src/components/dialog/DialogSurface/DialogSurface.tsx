import {
  Show,
  createEffect,
  createSignal,
  onCleanup,
  splitProps,
} from "solid-js";
import type { DialogSurfaceProps } from "./DialogSurface.types";
import { DialogPortal } from "../DialogPortal";
import { DialogOverlay } from "../DialogOverlay";
import { DialogContentContext } from "../DialogContent/DialogContent.context";
import { useDialogContext } from "../Dialog";
import { callEventHandler } from "~/utils";
import { useDialogFocus } from "./useDialogFocus";

/** 没有触发 animationend 时的兜底卸载延迟（与 usePresence 保持一致） */
const EXIT_FALLBACK_MS = 300;

export function DialogSurface(props: DialogSurfaceProps) {
  const { show, open, setShow } = useDialogContext();

  const [local, events, others] = splitProps(
    props,
    [
      "role",
      "dismissOnOverlayClick",
      "overlayClass",
      "class",
      "classList",
      "children",
    ],
    ["onKeyDown"],
  );

  const { handleKeyDown } = useDialogFocus(open);

  const [titleID, setTitleID] = createSignal<string>();
  const [descriptionID, setDescriptionID] = createSignal<string>();
  let surfaceRef: HTMLElement | undefined;
  let exitTimer: ReturnType<typeof setTimeout> | undefined;

  // 打开时把焦点移进浮层，否则键盘/读屏用户仍停在触发按钮上，
  // 拿不到"对话框已打开"的上下文（Drawer 同样处理）。
  createEffect(() => {
    if (!open()) return;
    const frame = requestAnimationFrame(() => {
      surfaceRef?.focus({ preventScroll: true });
    });
    onCleanup(() => cancelAnimationFrame(frame));
  });

  // 不能只依赖 animationend：motion-reduce:animate-none、自定义 class 覆盖动画、
  // 或忘记引入 keyframes 时，close 后节点会永久挂载，overlay 一直拦截点击。
  createEffect(() => {
    // 重开/已打开时直接返回：上一次 effect 的 onCleanup 已经清掉旧定时器，
    // 这里不再重复判断，避免出现一条永远走不到的防御分支。
    if (open() || !show()) return;

    exitTimer = setTimeout(() => {
      exitTimer = undefined;
      setShow(false);
    }, EXIT_FALLBACK_MS);
    onCleanup(() => {
      if (exitTimer !== undefined) {
        clearTimeout(exitTimer);
        exitTimer = undefined;
      }
    });
  });

  return (
    <Show when={show()}>
      <DialogContentContext.Provider value={{ setTitleID, setDescriptionID }}>
        <DialogPortal>
          <div
            role="presentation"
            class="fixed inset-0 select-none"
            aria-hidden="true"
          />
          <DialogOverlay
            dismissOnOverlayClick={local.dismissOnOverlayClick}
            class={local.overlayClass}
          />
          <span data-type="inside" class="sr-only" aria-hidden="true" />
          {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: role 为 dialog/alertdialog，二者都支持 aria-labelledby/aria-describedby */}
          <div
            ref={(el) => {
              surfaceRef = el;
            }}
            role={local.role ?? "dialog"}
            // 模态对话框要让辅助技术知道浮层之外的内容不可交互
            aria-modal="true"
            tabindex={-1}
            data-dialog-surface=""
            data-open={open()}
            class={local.class}
            classList={local.classList}
            aria-labelledby={titleID()}
            aria-describedby={descriptionID()}
            onKeyDown={(event) => {
              callEventHandler(events.onKeyDown, event);
              if (!event.defaultPrevented) handleKeyDown(event);
            }}
            onAnimationEnd={(event) => {
              // 只认 surface 自己播放的退场动画，子元素的 animationend 不卸载整层。
              if (event.target !== event.currentTarget) return;
              if (open()) return;
              setShow(false);
            }}
            {...others}
          >
            {local.children}
          </div>
          <span data-type="inside" class="sr-only" aria-hidden="true" />
        </DialogPortal>
      </DialogContentContext.Provider>
    </Show>
  );
}
