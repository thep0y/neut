import { For, createMemo, type JSX } from "solid-js";
import { useComboboxContext } from "../Combobox/Combobox.context";

export function ComboboxCollection(props: {
  items?: any[];
  children?: JSX.Element | ((item: any, index: number) => JSX.Element);
}) {
  const ctx = useComboboxContext("ComboboxCollection");
  const items = createMemo(() => props.items ?? ctx.items());
  const filtered = createMemo(() => {
    const query = ctx.filterValue().toLowerCase().trim();
    if (!query) return items();
    return items().filter((item) =>
      ctx.itemToStringValue(item).toLowerCase().includes(query),
    );
  });
  return (
    <For each={filtered()}>
      {(item, index) =>
        typeof props.children === "function"
          ? props.children(item, index())
          : props.children
      }
    </For>
  );
}
