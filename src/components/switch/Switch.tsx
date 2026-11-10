import { createMemo, createSignal, mergeProps, splitProps } from "solid-js";
import type { SwitchProps } from "./Switch.types";
import { callEventHandler, clsx } from "~/utils";
import { classes } from "./Switch.styles";

export const Switch = (props: SwitchProps) => {
  const merged = mergeProps({ size: "md" } as const, props);

  const [local, events, others] = splitProps(
    merged,
    [
      "id",
      "checked",
      "defaultChecked",
      "onCheckedChange",
      "size",
      "disabled",
      "class",
      "classList",
    ],
    ["onKeyDown"],
  );

  const [internalChecked, setInternalChecked] = createSignal(
    local.defaultChecked ?? false,
  );

  const toggle = () => {
    if (local.checked !== undefined) {
      setInternalChecked(local.checked);
      local.onCheckedChange?.(!local.checked);
      return;
    }

    const newChecked = !internalChecked();
    setInternalChecked(newChecked);
    local.onCheckedChange?.(newChecked);
  };

  const handleClick = () => {
    if (local.disabled) return;
    toggle();
  };

  /**
   * span + role="switch" 不会像原生 button 那样把 Space/Enter 合成 click，
   * 因此必须显式处理。Space 是 ARIA switch 的必需键；Enter 对齐 shadcn 的
   * button 实现。先让用户 onKeyDown 跑，用户 preventDefault 表示自行处理。
   */
  const handleKeyDown = (event: KeyboardEvent) => {
    callEventHandler(events.onKeyDown, event);
    if (event.defaultPrevented || local.disabled) return;
    if (event.key !== " " && event.key !== "Enter") return;

    event.preventDefault();
    if (event.repeat) return;
    toggle();
  };

  const checked = createMemo(() =>
    local.checked !== undefined ? local.checked : internalChecked(),
  );

  return (
    <span
      data-slot="switch"
      data-size={local.size}
      data-checked={checked()}
      data-disabled={local.disabled}
      role="switch"
      tabIndex={0}
      aria-checked={checked()}
      aria-disabled={local.disabled}
      class={clsx(classes.switch, local.class)}
      classList={local.classList}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...others}
    >
      <span
        data-slot="switch-thumb"
        class={classes.thumb}
        data-checked={checked()}
      />
      <input
        id={local.id}
        tabIndex={-1}
        aria-hidden="true"
        type="checkbox"
        checked={checked()}
        class="sr-only"
        disabled={local.disabled}
      />
    </span>
  );
};
