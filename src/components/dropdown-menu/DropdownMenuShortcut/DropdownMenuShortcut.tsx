import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import { dropdownMenuShortcutClass } from "../dropdown-menu.styles";
import type { DropdownMenuShortcutProps } from "./DropdownMenuShortcut.types";

export function DropdownMenuShortcut(props: DropdownMenuShortcutProps) {
  const [local, rest] = splitProps(props, ["class", "children"]);

  return (
    <span
      data-slot="dropdown-menu-shortcut"
      class={clsx(dropdownMenuShortcutClass, local.class)}
      {...rest}
    >
      {local.children}
    </span>
  );
}
