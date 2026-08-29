import { createMemo, createSignal, splitProps, type JSX } from "solid-js";
import { clsx } from "~/utils";
import { RadioGroupContext } from "./RadioGroup.context";
import type {
  RadioGroupContextValue,
  RadioGroupProps,
} from "./RadioGroup.types";

/**
 * RadioGroup 根组件：渲染一个 <div role="radiogroup">，并向下提供选中值、
 * 禁用状态和 item 注册方法。选中值支持受控（value）和非受控（defaultValue）。
 *
 * @example
 * ```tsx
 * <RadioGroup defaultValue="comfortable">
 *   <RadioGroupItem value="default" />
 *   <RadioGroupItem value="comfortable" />
 * </RadioGroup>
 * ```
 */
export function RadioGroup(props: RadioGroupProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "defaultValue",
    "onValueChange",
    "disabled",
    "name",
    "class",
    "classList",
    "style",
    "dir",
    "children",
  ]);

  const [internalValue, setInternalValue] = createSignal(local.defaultValue);
  const value = createMemo(() =>
    local.value !== undefined ? local.value : internalValue(),
  );
  const disabled = createMemo(() => !!local.disabled);

  const itemElements = new Map<string, HTMLElement>();

  const setValue = (next: string) => {
    if (local.value === undefined) setInternalValue(next);
    local.onValueChange?.(next);
  };

  const registerItem = (itemValue: string, element: HTMLElement) => {
    itemElements.set(itemValue, element);
    return () => {
      if (itemElements.get(itemValue) === element) {
        itemElements.delete(itemValue);
      }
    };
  };

  const focusItem = (itemValue: string) => {
    itemElements.get(itemValue)?.focus();
  };

  const ctx: RadioGroupContextValue = {
    value,
    setValue,
    disabled,
    name: local.name,
    registerItem,
    focusItem,
  };

  return (
    <div
      role="radiogroup"
      data-slot="radio-group"
      class={clsx("grid w-full gap-2", local.class)}
      style={local.style}
      dir={local.dir}
      {...rest}
    >
      <RadioGroupContext.Provider value={ctx}>
        {local.children}
      </RadioGroupContext.Provider>
    </div>
  );
}
