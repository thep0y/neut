import { Show, mergeProps, onCleanup, splitProps } from "solid-js";
import { Portal } from "solid-js/web";
import { clsx } from "~/utils";
import type { ComboboxContentProps } from "./ComboboxContent.types";
import { useComboboxContent } from "./useComboboxContent";

export function ComboboxContent(props: ComboboxContentProps) {
  const merged = mergeProps(
    { side: "bottom", align: "start", sideOffset: 6, alignOffset: 0 } as const,
    props,
  );
  const [local, others] = splitProps(merged, [
    "side",
    "align",
    "alignOffset",
    "sideOffset",
  ]);

  const { ctx, style } = useComboboxContent(() => local);

  return (
    <Show when={ctx.open()}>
      <Portal>
        <div
          ref={(el) => {
            ctx.setFloating(el);
            onCleanup(() => ctx.setFloating(undefined));
          }}
          style={style()}
        >
          <div
            id={ctx.contentId}
            data-slot="combobox-content"
            data-side={local.side}
            data-align={local.align}
            class={clsx(
              "group/combobox-content relative max-h-96 w-(--anchor-width) max-w-(--available-width) min-w-[calc(var(--anchor-width)+(--spacing(7)))] origin-(--transform-origin) overflow-hidden rounded-md bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[chips=true]:min-w-(--anchor-width) data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-8 *:data-[slot=input-group]:border-input/30 *:data-[slot=input-group]:bg-input/30 *:data-[slot=input-group]:shadow-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
              merged.class,
            )}
            {...others}
          />
        </div>
      </Portal>
    </Show>
  );
}
