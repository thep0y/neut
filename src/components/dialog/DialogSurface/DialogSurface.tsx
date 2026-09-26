import { Show, createSignal, splitProps } from "solid-js";
import type { DialogSurfaceProps } from "./DialogSurface.types";
import { DialogPortal } from "../DialogPortal";
import { DialogOverlay } from "../DialogOverlay";
import { DialogContentContext } from "../DialogContent/DialogContent.context";
import { useDialogContext } from "../Dialog";

export function DialogSurface(props: DialogSurfaceProps) {
  const { show, open, setShow } = useDialogContext();

  const [local, others] = splitProps(props, [
    "role",
    "dismissOnOverlayClick",
    "overlayClass",
    "class",
    "classList",
    "children",
  ]);

  const [titleID, setTitleID] = createSignal<string>();
  const [descriptionID, setDescriptionID] = createSignal<string>();

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
            role={local.role ?? "dialog"}
            data-dialog-surface=""
            data-open={open()}
            class={local.class}
            classList={local.classList}
            aria-labelledby={titleID()}
            aria-describedby={descriptionID()}
            onAnimationEnd={() => {
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
