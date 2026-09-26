import {
  createUniqueId,
  onCleanup,
  onMount,
  splitProps,
  useContext,
} from "solid-js";
import { clsx } from "~/utils";
import { ContextMenuGroupContext } from "~/components/context-menu/context-menu.context";
import { dropdownMenuLabelClass } from "../dropdown-menu.styles";
import type { DropdownMenuLabelProps } from "./DropdownMenuLabel.types";

export function DropdownMenuLabel(props: DropdownMenuLabelProps) {
  // Label 允许不套 Group；只有存在 Group 时才登记 label id
  const group = useContext(ContextMenuGroupContext);
  const [local, rest] = splitProps(props, ["class", "children", "inset"]);
  const id = `dropdown-menu-label-${createUniqueId()}`;

  onMount(() => {
    group?.setLabelId(id);
    onCleanup(() => group?.setLabelId(undefined));
  });

  return (
    <div
      id={id}
      data-slot="dropdown-menu-label"
      data-inset={local.inset ? "" : undefined}
      class={clsx(dropdownMenuLabelClass, local.class)}
      {...rest}
    >
      {local.children}
    </div>
  );
}
