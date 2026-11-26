import { Show, type JSX } from "solid-js";
import { clsx } from "~/utils";
import { useComboboxContext } from "../Combobox/Combobox.context";

export function ComboboxEmpty(props: {
  children?: JSX.Element;
  class?: string;
}) {
  const ctx = useComboboxContext("ComboboxEmpty");

  return (
    <Show when={ctx.filteredItems().length === 0}>
      <div
        data-slot="combobox-empty"
        class={clsx(
          "w-full justify-center py-2 text-center text-sm text-muted-foreground",
          props.class,
        )}
      >
        {props.children}
      </div>
    </Show>
  );
}
