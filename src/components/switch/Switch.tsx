import { createSignal, mergeProps, splitProps } from "solid-js";
import type { SwitchProps } from "./Switch.types";
import { clsx } from "~/lib/utils";
import { classes } from "./Switch.styles";

export const Switch = (props: SwitchProps) => {
  const merged = mergeProps({ size: "md" } as const, props);

  const [local, others] = splitProps(merged, [
    "id",
    "defaultChecked",
    "onChange",
    "size",
    "disabled",
    "class",
    "classList",
  ]);

  const [checked, setChecked] = createSignal(local.defaultChecked);

  const handleClick = () => {
    const newChecked = !checked();
    setChecked(newChecked);
    local.onChange?.(newChecked);
  };

  return (
    <>
      <span
        data-slot="switch"
        data-size={local.size}
        data-checked={checked() ? "" : undefined}
        data-unchecked={!checked() ? "" : undefined}
        data-disabled={local.disabled ? "" : undefined}
        role="switch"
        tabIndex={0}
        aria-checked={checked()}
        class={clsx(classes.switch, local.class)}
        onClick={handleClick}
        {...others}
      >
        <span
          data-slot="switch-thumb"
          class={classes.thumb}
          data-checked={checked() ? "" : undefined}
          data-unchecked={!checked() ? "" : undefined}
        />
      </span>

      <input
        id={local.id}
        tabIndex={-1}
        aria-hidden="true"
        type="checkbox"
        checked={checked()}
        class={classes.input}
        disabled={local.disabled}
      />
    </>
  );
};
