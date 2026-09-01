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
      class={clsx(
        "h-8 [&_svg:not([class*='size-'])]:size-4 active:not-aria-[haspopup]:translate-y-0",
        props.class,
      )}
      disabled={ctx.disabled() || props.disabled}
      onClick={() => ctx.setOpen(!ctx.open())}
    >
      {props.children}
      <ChevronDown
        data-slot="combobox-trigger-icon"
        class="pointer-events-none size-4 text-muted-foreground"
      />
    </InputGroupButton>
  );
}
