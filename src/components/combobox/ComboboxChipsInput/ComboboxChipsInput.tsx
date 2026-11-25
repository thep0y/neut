import { clsx } from "~/utils";
import { useComboboxContext } from "../Combobox/Combobox.context";
import { createComboboxKeyboard } from "../combobox.keyboard";

export function ComboboxChipsInput(props: {
  placeholder?: string;
  class?: string;
}) {
  const ctx = useComboboxContext("ComboboxChipsInput");
  const { activeOptionId, onKeyDown } = createComboboxKeyboard(ctx);

  const handleKeyDown = (event: KeyboardEvent) => {
    // 输入框为空时按 Backspace 删除最后一颗 chip（chips 模式的常见约定）
    if (event.key === "Backspace" && ctx.inputValue() === "") {
      const current = ctx.value();
      if (Array.isArray(current) && current.length > 0) {
        event.preventDefault();
        ctx.setValue(current.slice(0, -1) as never, "chip-remove", event);
      }
      return;
    }

    onKeyDown(event);
  };

  return (
    <input
      data-slot="combobox-chip-input"
      role="combobox"
      aria-expanded={ctx.open()}
      aria-controls={ctx.open() ? ctx.listId : undefined}
      aria-autocomplete="list"
      aria-activedescendant={activeOptionId()}
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
      onKeyDown={handleKeyDown}
    />
  );
}
