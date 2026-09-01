import { clsx } from "~/utils";
import { useComboboxContext } from "../Combobox/Combobox.context";

export function ComboboxChipsInput(props: {
  placeholder?: string;
  class?: string;
}) {
  const ctx = useComboboxContext("ComboboxChipsInput");
  return (
    <input
      data-slot="combobox-chip-input"
      class={clsx("min-w-16 flex-1 bg-transparent outline-none", props.class)}
      placeholder={props.placeholder}
      disabled={ctx.disabled()}
      value={ctx.inputValue()}
      onInput={(e) => {
        const next = e.currentTarget.value;
        ctx.setInputValue(next);
        ctx.setFilterValue(next);
        ctx.setOpen(true);
      }}
      onFocus={() => ctx.setOpen(true)}
    />
  );
}
