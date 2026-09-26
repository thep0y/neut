import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import { useContextMenuEntry } from "~/components/context-menu/context-menu.entry";
import { dropdownMenuItemClass } from "../dropdown-menu.styles";
import type { DropdownMenuItemProps } from "./DropdownMenuItem.types";

export function DropdownMenuItem(props: DropdownMenuItemProps) {
  const [local, rest] = splitProps(props, [
    "class",
    "children",
    "inset",
    "variant",
    "disabled",
    "label",
    "closeOnClick",
    "onClick",
  ]);

  let element: HTMLDivElement | undefined;

  const entry = useContextMenuEntry({
    component: "DropdownMenuItem",
    element: () => element,
    disabled: () => !!local.disabled,
    label: () => local.label,
  });

  const handleClick = (e: MouseEvent) => {
    if (local.disabled) return;
    local.onClick?.(e);
    if (e.defaultPrevented) return;
    if (local.closeOnClick !== false) entry.popup.closeAll("item-press", e);
  };

  return (
    <div
      ref={(el) => {
        element = el;
      }}
      id={entry.id}
      role="menuitem"
      tabIndex={-1}
      data-slot="dropdown-menu-item"
      data-inset={local.inset ? "" : undefined}
      data-variant={local.variant ?? "default"}
      data-highlighted={entry.isActive() ? "" : undefined}
      data-disabled={local.disabled ? "" : undefined}
      aria-disabled={local.disabled ? "true" : undefined}
      onClick={handleClick}
      onPointerEnter={() => entry.highlight()}
      onPointerMove={() => entry.highlight()}
      class={clsx(dropdownMenuItemClass, local.class)}
      {...rest}
    >
      {local.children}
    </div>
  );
}
