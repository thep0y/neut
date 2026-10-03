import type { JSX } from "solid-js";
import { ChevronDown } from "lucide-solid";
import { clsx } from "~/utils";
import { useComboboxContext } from "../Combobox/Combobox.context";
import { InputGroupButton } from "~/components/input-group";

export function ComboboxTrigger(props: {
  children?: JSX.Element;
  class?: string;
  disabled?: boolean;
}) {
  const ctx = useComboboxContext("ComboboxTrigger");
  return (
    <InputGroupButton
      ref={ctx.setReference}
      variant="outline"
      data-slot="combobox-trigger"
      // 触发器是弹出 listbox 的按钮
      aria-haspopup="listbox"
      aria-expanded={ctx.open()}
      aria-controls={ctx.open() ? ctx.listId : undefined}
      class={clsx(
        "h-8 [&_svg:not([class*='size-'])]:size-4 active:not-aria-[haspopup]:translate-y-0",
        props.class,
      )}
      disabled={ctx.disabled() || props.disabled}
      onClick={(event) =>
        ctx.setOpen(!ctx.open(), "trigger-press", event as unknown as Event)
      }
    >
      {props.children}
      <ChevronDown
        data-slot="combobox-trigger-icon"
        class="pointer-events-none size-4 text-muted-foreground"
      />
    </InputGroupButton>
  );
}
