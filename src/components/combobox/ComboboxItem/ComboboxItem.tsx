import { Show, createMemo, createSignal, type JSX } from "solid-js";
import { Check } from "lucide-solid";
import { clsx } from "~/utils";
import { useComboboxContext } from "../Combobox/Combobox.context";

export function ComboboxItem(props: {
  value: any;
  children?: JSX.Element;
  class?: string;
  disabled?: boolean;
}) {
  const ctx = useComboboxContext("ComboboxItem");
  const selected = createMemo(() => ctx.isSelected(props.value));
  const active = createMemo(
    () => ctx.filteredItems()[ctx.activeIndex()] === props.value,
  );
  const [hovered, setHovered] = createSignal(false);

  return (
    <div
      data-slot="combobox-item"
      role="option"
      tabIndex={props.disabled ? -1 : 0}
      aria-selected={selected()}
      data-highlighted={active() || hovered() ? "" : undefined}
      class={clsx(
        "relative flex w-full cursor-default items-center gap-2 rounded-md py-1 pr-8 pl-1.5 text-sm outline-none select-none",
        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
        props.disabled && "pointer-events-none opacity-50",
        props.class,
      )}
      onMouseEnter={() => {
        setHovered(true);
        const index = ctx.filteredItems().indexOf(props.value);
        if (index !== -1) ctx.setActiveIndex(index);
      }}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (!props.disabled) ctx.selectItem(props.value);
      }}
    >
      {props.children}
      <Show when={selected()}>
        <Check class="pointer-events-none absolute right-2 size-4" />
      </Show>
    </div>
  );
}
