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
        ctx.setOpen(true, "input-change");
      }}
      onFocus={() => ctx.setOpen(true, "input-focus")}
      onKeyDown={(e) => {
        // 输入框为空时按 Backspace 删除最后一颗 chip（chips 模式的常见约定）
        if (e.key !== "Backspace") return;
        if (ctx.inputValue() !== "") return;
        const current = ctx.value();
        if (!Array.isArray(current) || current.length === 0) return;
        e.preventDefault();
        ctx.setValue(current.slice(0, -1) as never);
      }}
    />
  );
}
