import { createMemo, createSignal, splitProps, type JSX } from "solid-js";
import { clsx } from "~/utils";
import { ToggleGroupContext } from "./ToggleGroup.context";
import type {
  ToggleGroupContextValue,
  ToggleGroupProps,
} from "./ToggleGroup.types";

export function ToggleGroup(props: ToggleGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "multiple",
    "disabled",
    "orientation",
    "spacing",
    "variant",
    "size",
    "class",
    "children",
    "dir",
  ]);

  const [internalValue, setInternalValue] = createSignal<string[]>(
    local.defaultValue ?? [],
  );
  const value = createMemo(() =>
    local.value !== undefined ? local.value : internalValue(),
  );
  const multiple = createMemo(() => !!local.multiple);
  const disabled = createMemo(() => !!local.disabled);
  const orientation = createMemo(() => local.orientation ?? "horizontal");
  const spacing = createMemo(() => local.spacing ?? 2);
  const variant = createMemo(() => local.variant ?? "default");
  const size = createMemo(() => local.size ?? "default");

  const setValue = (next: string[]) => {
    if (local.value === undefined) setInternalValue(next);
    local.onValueChange?.(next);
  };

  const ctx: ToggleGroupContextValue = {
    value,
    setValue,
    multiple,
    disabled,
    orientation,
    spacing,
    variant,
    size,
  };

  return (
    <div
      role="group"
      data-slot="toggle-group"
      data-variant={variant()}
      data-size={size()}
      data-spacing={spacing()}
      data-orientation={orientation()}
      style={{ "--gap": spacing() } as JSX.CSSProperties}
      dir={local.dir}
      class={clsx(
        "group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] rounded-lg data-[size=sm]:rounded-[min(var(--radius-md),10px)] data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch",
        local.class,
      )}
      {...rest}
    >
      <ToggleGroupContext.Provider value={ctx}>
        {local.children}
      </ToggleGroupContext.Provider>
    </div>
  );
}
