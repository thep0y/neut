import {
  createMemo,
  createSignal,
  createUniqueId,
  mergeProps,
  splitProps,
} from "solid-js";
import type { CheckboxProps } from "./Checkbox.types";
import { clsx } from "~/utils";
import { classes } from "./Checkbox.styles";
import { CheckboxIndicator } from "../CheckboxIndicator";

export const Checkbox = (props: CheckboxProps) => {
  const defaultID = createUniqueId();
  const merged = mergeProps(
    { id: defaultID, name: defaultID, defaultChecked: false } as const,
    props,
  );

  const [local, others] = splitProps(merged, [
    "name",
    "id",
    "checked",
    "defaultChecked",
    "onChange",
    "disabled",
    "class",
    "classList",
  ]);

  const [internalChecked, setInternalChecked] = createSignal(
    local.defaultChecked,
  );

  const checked = createMemo(() => local.checked ?? internalChecked());

  const handleClick = () => {
    if (local.disabled) return;

    const newChecked = !checked();
    setInternalChecked(newChecked);
    local.onChange?.(newChecked);
  };

  return (
    <>
      <span
        data-slot="checkbox"
        role="checkbox"
        tabIndex={0}
        aria-checked={checked()}
        aria-disabled={local.disabled}
        data-disabled={local.disabled}
        data-checked={checked()}
        aria-labelledby={local.id}
        class={clsx(classes, local.class)}
        onClick={handleClick}
        {...others}
      >
        <CheckboxIndicator checked={checked()} />
      </span>
      <input
        id={local.id}
        type="checkbox"
        checked={checked()}
        tabIndex={-1}
        aria-hidden="true"
        name={local.name}
        class="sr-only"
        disabled={local.disabled}
      />
    </>
  );
};
