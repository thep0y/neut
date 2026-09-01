import { For, type JSX } from "solid-js";
import { clsx } from "~/utils";
import { useComboboxContext } from "../Combobox/Combobox.context";

export function ComboboxList(props: {
  children?: JSX.Element | ((item: any, index: number) => JSX.Element);
  class?: string;
}) {
  const ctx = useComboboxContext("ComboboxList");
  const listItems = () => (ctx.isGrouped() ? ctx.items() : ctx.filteredItems());

  return (
    <div
      data-slot="combobox-list"
      class={clsx(
        "max-h-72 overflow-y-auto overscroll-contain p-1",
        props.class,
      )}
      role="listbox"
    >
      <For each={listItems()}>
        {(item, index) =>
          typeof props.children === "function"
            ? props.children(item, index())
            : props.children
        }
      </For>
    </div>
  );
}
