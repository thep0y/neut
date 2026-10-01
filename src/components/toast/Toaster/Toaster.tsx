import { For, mergeProps, Show, type Component } from "solid-js";
import { Portal } from "solid-js/web";
import { clsx } from "~/utils";
import { Toast } from "../Toast";
import type { Position, ToastT } from "../Toast/Toast.types";
import { removeToast, useSonner } from "../state/toast";
import type { ToasterProps } from "./Toaster.types";
import { toasterContainerClass } from "./Toaster.styles";
import {
  getDocumentDirection,
  getPositionClass,
  resolveOffsetStyle,
} from "./Toaster.utils";
import { useToaster } from "./useToaster";

export const Toaster: Component<ToasterProps> = (props) => {
  const merged = mergeProps(
    {
      position: "bottom-right",
      gap: 14,
      visibleToasts: 3,
      dir: getDocumentDirection(),
      containerAriaLabel: "Notifications",
      hotkey: ["altKey", "KeyT"] as string[],
    } as const,
    props,
  );

  const { toasts } = useSonner();

  const { expanded, setExpanded, possiblePositions, visibleToastsForPosition } =
    useToaster({
      toasts: () => toasts,
      toasterId: () => merged.id,
      position: () => merged.position,
      visibleToasts: () => merged.visibleToasts,
      expand: () => merged.expand,
      hotkey: () => merged.hotkey,
    });

  const offsetStyle = (position: Position) =>
    resolveOffsetStyle(position, merged.offset, merged.mobileOffset);

  return (
    <Portal>
      <div
        data-slot="toaster"
        dir={merged.dir === "auto" ? getDocumentDirection() : merged.dir}
      >
        <For each={possiblePositions()}>
          {(position) => (
            <Show when={visibleToastsForPosition(position).length > 0}>
              <ol
                data-slot="toaster-viewport"
                data-position={position}
                aria-live="polite"
                aria-relevant="additions text"
                aria-atomic="false"
                aria-label={merged.customAriaLabel ?? merged.containerAriaLabel}
                tabIndex={-1}
                class={clsx(
                  toasterContainerClass,
                  getPositionClass(position),
                  expanded()
                    ? position.startsWith("top")
                      ? "flex flex-col"
                      : "flex flex-col-reverse"
                    : "grid",
                )}
                style={{
                  gap: `${merged.gap}px`,
                  ...offsetStyle(position),
                  ...(merged.style as Record<string, string | number>),
                }}
                onMouseEnter={() => setExpanded(true)}
                onMouseLeave={() => setExpanded(false)}
              >
                <For each={visibleToastsForPosition(position)}>
                  {(toast: ToastT, index) => (
                    <Toast
                      toast={toast}
                      index={index()}
                      total={visibleToastsForPosition(position).length}
                      expanded={expanded()}
                      position={position}
                      gap={merged.gap}
                      closeButton={
                        toast.closeButton ??
                        merged.toastOptions?.closeButton ??
                        merged.closeButton ??
                        false
                      }
                      duration={
                        merged.toastOptions?.duration ?? merged.duration
                      }
                      class={merged.toastOptions?.class}
                      icons={merged.icons}
                      closeButtonAriaLabel={
                        merged.toastOptions?.closeButtonAriaLabel
                      }
                      defaultRichColors={merged.richColors}
                      onRemove={removeToast}
                    />
                  )}
                </For>
              </ol>
            </Show>
          )}
        </For>
      </div>
    </Portal>
  );
};
