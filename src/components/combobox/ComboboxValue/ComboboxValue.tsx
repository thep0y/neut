import { children, createMemo, type JSX } from "solid-js";
import { useComboboxContext } from "../Combobox/Combobox.context";

export function ComboboxValue(props: {
  placeholder?: string;
  children?: JSX.Element | ((values: any[]) => JSX.Element);
}): JSX.Element {
  const ctx = useComboboxContext("ComboboxValue");
  const selected = createMemo(() => {
    const current = ctx.value();
    if (current == null) return [] as any[];
    return Array.isArray(current) ? current : [current];
  });

  const render = children(() => {
    if (typeof props.children === "function") return props.children(selected());
    if (selected().length > 0) {
      return selected()
        .map((item) => ctx.itemToStringValue(item))
        .join(", ") as unknown as JSX.Element;
    }
    return (props.placeholder ?? "") as unknown as JSX.Element;
  });

  return <>{render()}</>;
}
