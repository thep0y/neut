import { createMemo, createSignal, splitProps, type JSX } from "solid-js";
import { clsx } from "~/utils";
import { ToggleGroupContext } from "./ToggleGroup.context";
import { toggleGroupVariants } from "./ToggleGroup.styles";
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
      // 拼接态样式依赖 data-vertical / data-horizontal(与 tabs 根保持一致)
      data-vertical={orientation() === "vertical" ? "" : null}
      data-horizontal={orientation() === "vertical" ? null : ""}
      style={{ "--gap": spacing() } as JSX.CSSProperties}
      dir={local.dir}
      class={clsx(toggleGroupVariants(), local.class)}
      {...rest}
    >
      <ToggleGroupContext.Provider value={ctx}>
        {local.children}
      </ToggleGroupContext.Provider>
    </div>
  );
}
