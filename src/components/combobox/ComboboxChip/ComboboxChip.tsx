import { Show, type JSX } from "solid-js";
import { X } from "lucide-solid";
import { clsx } from "~/utils";
import { useComboboxContext } from "../Combobox/Combobox.context";
import { Button } from "~/components/button";

export function ComboboxChip(props: {
  value: any;
  children?: JSX.Element;
  class?: string;
  showRemove?: boolean;
}) {
  const ctx = useComboboxContext("ComboboxChip");
  return (
    <span
      data-slot="combobox-chip"
      class={clsx(
        "flex h-[calc(--spacing(5.25))] w-fit items-center justify-center gap-1 rounded-sm bg-muted px-1.5 text-xs font-medium whitespace-nowrap text-foreground has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50 has-data-[slot=combobox-chip-remove]:pr-0",
        props.class,
      )}
    >
      {props.children}
      <Show when={props.showRemove !== false}>
        <Button
          variant="ghost"
          size="xs"
          data-slot="combobox-chip-remove"
          class="-ml-1 opacity-50 hover:opacity-100"
          onClick={() => ctx.selectItem(props.value)}
          icon={<X class="pointer-events-none" />}
        />
      </Show>
    </span>
  );
}
