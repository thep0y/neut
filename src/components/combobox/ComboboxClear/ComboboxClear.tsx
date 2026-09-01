import { X } from "lucide-solid";
import { useComboboxContext } from "../Combobox/Combobox.context";
import { InputGroupButton } from "~/components/input-group";

export function ComboboxClear(props: { disabled?: boolean; class?: string }) {
  const ctx = useComboboxContext("ComboboxClear");
  return (
    <InputGroupButton
      variant="ghost"
      size="xs"
      data-slot="combobox-clear"
      aria-label="Clear"
      disabled={ctx.disabled() || props.disabled}
      class={props.class}
      onClick={() => {
        ctx.setValue(null);
        ctx.setInputValue("");
        ctx.setFilterValue("");
        ctx.setOpen(false);
      }}
      icon={<X class='"pointer-events-none' />}
    />
  );
}
