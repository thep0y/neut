import { Show, splitProps } from "solid-js";
import { Check } from "lucide-solid";
import { clsx } from "~/utils";
import { useContextMenuRadioGroup } from "~/components/context-menu/context-menu.context";
import { useContextMenuEntry } from "~/components/context-menu/context-menu.entry";
import {
  dropdownMenuCheckableItemClass,
  dropdownMenuIndicatorClass,
} from "../dropdown-menu.styles";
import type { DropdownMenuRadioItemProps } from "./DropdownMenuRadioItem.types";

export function DropdownMenuRadioItem(props: DropdownMenuRadioItemProps) {
  const group = useContextMenuRadioGroup("DropdownMenuRadioItem");
  const [local, rest] = splitProps(props, [
    "class",
    "children",
    "value",
    "disabled",
    "inset",
    "label",
    "closeOnClick",
    "onClick",
  ]);

  const disabled = () => !!local.disabled || group.disabled();
  const checked = () => group.value() === props.value;

  let element: HTMLDivElement | undefined;

  const entry = useContextMenuEntry({
    component: "DropdownMenuRadioItem",
    element: () => element,
    disabled,
    label: () => local.label,
  });

  const handleClick = (e: MouseEvent) => {
    if (disabled()) return;
    local.onClick?.(e);
    if (e.defaultPrevented) return;

    group.setValue(props.value, e);

    if (local.closeOnClick) entry.popup.closeAll("item-press", e);
  };

  return (
    <div
      ref={(el) => {
        element = el;
      }}
      id={entry.id}
      role="menuitemradio"
      tabIndex={-1}
      aria-checked={checked()}
      data-slot="dropdown-menu-radio-item"
      data-inset={local.inset ? "" : undefined}
      data-checked={checked() ? "" : undefined}
      data-unchecked={checked() ? undefined : ""}
      data-highlighted={entry.isActive() ? "" : undefined}
      data-disabled={disabled() ? "" : undefined}
      aria-disabled={disabled() ? "true" : undefined}
      onClick={handleClick}
      onPointerEnter={() => entry.highlight()}
      onPointerMove={() => entry.highlight()}
      class={clsx(dropdownMenuCheckableItemClass, local.class)}
      {...rest}
    >
      <span class={dropdownMenuIndicatorClass}>
        <Show when={checked()}>
          <Check />
        </Show>
      </span>
      {local.children}
    </div>
  );
}
