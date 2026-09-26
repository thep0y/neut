import { createSignal, Show, splitProps } from "solid-js";
import { Check } from "lucide-solid";
import { clsx } from "~/utils";
import { useContextMenuEntry } from "~/components/context-menu/context-menu.entry";
import { createChangeEventDetails } from "~/components/context-menu/context-menu.utils";
import {
  dropdownMenuCheckableItemClass,
  dropdownMenuIndicatorClass,
} from "../dropdown-menu.styles";
import type { DropdownMenuCheckboxItemProps } from "./DropdownMenuCheckboxItem.types";

export function DropdownMenuCheckboxItem(props: DropdownMenuCheckboxItemProps) {
  const [local, rest] = splitProps(props, [
    "class",
    "children",
    "checked",
    "defaultChecked",
    "onCheckedChange",
    "disabled",
    "inset",
    "label",
    "closeOnClick",
    "onClick",
  ]);

  const [internalChecked, setInternalChecked] = createSignal(
    props.defaultChecked ?? false,
  );
  const checked = () =>
    props.checked !== undefined ? props.checked : internalChecked();

  let element: HTMLDivElement | undefined;

  const entry = useContextMenuEntry({
    component: "DropdownMenuCheckboxItem",
    element: () => element,
    disabled: () => !!local.disabled,
    label: () => local.label,
  });

  const handleClick = (e: MouseEvent) => {
    if (local.disabled) return;
    local.onClick?.(e);
    if (e.defaultPrevented) return;

    const next = !checked();
    if (props.checked === undefined) setInternalChecked(next);
    props.onCheckedChange?.(
      next,
      createChangeEventDetails("item-press", e, element),
    );

    if (local.closeOnClick) entry.popup.closeAll("item-press", e);
  };

  return (
    <div
      ref={(el) => {
        element = el;
      }}
      id={entry.id}
      role="menuitemcheckbox"
      tabIndex={-1}
      aria-checked={checked()}
      data-slot="dropdown-menu-checkbox-item"
      data-inset={local.inset ? "" : undefined}
      data-checked={checked() ? "" : undefined}
      data-unchecked={checked() ? undefined : ""}
      data-highlighted={entry.isActive() ? "" : undefined}
      data-disabled={local.disabled ? "" : undefined}
      aria-disabled={local.disabled ? "true" : undefined}
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
