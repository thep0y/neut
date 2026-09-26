import { createSignal, splitProps } from "solid-js";
import { ContextMenuGroupContext } from "~/components/context-menu/context-menu.context";
import type { ContextMenuGroupContextValue } from "~/components/context-menu/context-menu.types";
import type { DropdownMenuGroupProps } from "./DropdownMenuGroup.types";

export function DropdownMenuGroup(props: DropdownMenuGroupProps) {
  const [local, rest] = splitProps(props, ["class", "children"]);

  const [labelId, setLabelId] = createSignal<string>();
  const ctx: ContextMenuGroupContextValue = { labelId, setLabelId };

  return (
    <ContextMenuGroupContext.Provider value={ctx}>
      <div
        role="group"
        aria-labelledby={labelId()}
        data-slot="dropdown-menu-group"
        class={local.class}
        {...rest}
      >
        {local.children}
      </div>
    </ContextMenuGroupContext.Provider>
  );
}
