import { createMemo, createSignal, splitProps } from "solid-js";
import {
  ContextMenuGroupContext,
  ContextMenuRadioGroupContext,
} from "~/components/context-menu/context-menu.context";
import type {
  ContextMenuGroupContextValue,
  ContextMenuRadioGroupContextValue,
} from "~/components/context-menu/context-menu.types";
import { createChangeEventDetails } from "~/components/context-menu/context-menu.utils";
import type { DropdownMenuRadioGroupProps } from "./DropdownMenuRadioGroup.types";

export function DropdownMenuRadioGroup(props: DropdownMenuRadioGroupProps) {
  const [local, rest] = splitProps(props, [
    "class",
    "children",
    "value",
    "defaultValue",
    "onValueChange",
    "disabled",
  ]);

  const [internalValue, setInternalValue] = createSignal(props.defaultValue);
  const value = createMemo(() =>
    props.value !== undefined ? props.value : internalValue(),
  );

  const [labelId, setLabelId] = createSignal<string>();
  const groupCtx: ContextMenuGroupContextValue = { labelId, setLabelId };

  const ctx: ContextMenuRadioGroupContextValue = {
    value,
    setValue: (next, event) => {
      if (props.value === undefined) setInternalValue(() => next);
      props.onValueChange?.(
        next,
        createChangeEventDetails("item-press", event),
      );
    },
    disabled: () => !!local.disabled,
  };

  return (
    <ContextMenuRadioGroupContext.Provider value={ctx}>
      <ContextMenuGroupContext.Provider value={groupCtx}>
        <div
          role="group"
          aria-labelledby={labelId()}
          data-slot="dropdown-menu-radio-group"
          class={local.class}
          {...rest}
        >
          {local.children}
        </div>
      </ContextMenuGroupContext.Provider>
    </ContextMenuRadioGroupContext.Provider>
  );
}
