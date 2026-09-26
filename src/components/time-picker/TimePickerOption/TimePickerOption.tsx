import { splitProps, type JSX } from "solid-js";
import { clsx } from "~/utils";
import type { TimePickerOptionProps } from "./TimePickerOption.types";

/**
 * 时间列里的一项,渲染为 `role="option"`。
 *
 * 焦点在列(listbox)上,选项自身不可聚焦,交互由调用方通过 `onSelect` 处理;
 * 状态通过 data-selected / data-disabled 暴露给样式。
 */
export function TimePickerOption(props: TimePickerOptionProps): JSX.Element {
  const [local, rest] = splitProps(props, [
    "value",
    "id",
    "selected",
    "disabled",
    "class",
    "children",
    "onSelect",
  ]);

  return (
    <div
      {...rest}
      id={local.id}
      role="option"
      tabIndex={-1}
      aria-selected={local.selected}
      aria-disabled={local.disabled}
      data-value={String(local.value)}
      data-selected={local.selected ? "true" : undefined}
      data-highlighted={local.selected ? "true" : undefined}
      data-disabled={local.disabled ? "" : undefined}
      class={clsx(
        "flex h-8 w-full cursor-pointer items-center justify-center rounded-md text-sm tabular-nums select-none",
        "hover:bg-muted",
        "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:hover:bg-primary",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        local.class,
      )}
      onClick={(event) => local.onSelect?.(event)}
    >
      {local.children ?? String(local.value)}
    </div>
  );
}
