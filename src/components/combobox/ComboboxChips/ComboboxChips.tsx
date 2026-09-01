import type { JSX } from "solid-js";
import { clsx } from "~/utils";
import { useComboboxContext } from "../Combobox/Combobox.context";

export function ComboboxChips(props: {
  children?: JSX.Element;
  class?: string;
}) {
  const ctx = useComboboxContext("ComboboxChips");
  return (
    <div
      ref={ctx.setReference}
      role="toolbar"
      data-slot="combobox-chips"
      class={clsx(
        "flex min-h-8 flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent bg-clip-padding px-2.5 py-1 text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 has-data-[slot=combobox-chip]:px-1 dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40",
        props.class,
      )}
    >
      {props.children}
    </div>
  );
}
