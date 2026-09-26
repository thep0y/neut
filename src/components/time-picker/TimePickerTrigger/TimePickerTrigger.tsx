import type { ValidComponent } from "solid-js";
import { Clock } from "lucide-solid";
import type { Button } from "~/components/button";
import { PopoverTrigger } from "~/components/popover";
import type { PopoverTriggerProps } from "~/components/popover";
import { clsx } from "~/utils";
import { useTimePickerContext } from "../TimePicker/TimePicker.context";
import type { TimePickerTriggerProps } from "./TimePickerTrigger.types";

/**
 * TimePicker 的触发器:复用 <PopoverTrigger> 的按钮语义与 ARIA
 * (`aria-haspopup` / `aria-expanded` / `aria-controls`)与浮层引用注册,
 * 只负责把当前时间格式化成展示文本。默认标签是 Button,可用 `component` 替换。
 */
export function TimePickerTrigger<
  T extends ValidComponent = typeof Button<"button">,
>(props: TimePickerTriggerProps<T>) {
  const ctx = useTimePickerContext("TimePickerTrigger");

  const displayText = () => {
    const value = ctx.value();
    if (value) return ctx.formatTime(value);
    return ctx.placeholder() ?? "Pick a time";
  };

  return (
    <PopoverTrigger
      {...(props as PopoverTriggerProps<T>)}
      variant={props.variant ?? "outline"}
      disabled={ctx.disabled() || props.disabled}
      data-empty={ctx.value() === undefined ? "true" : "false"}
      class={clsx(
        "w-40 justify-between text-left font-normal tabular-nums",
        "data-[empty=true]:text-muted-foreground",
        props.class,
      )}
    >
      <span class="truncate">{displayText()}</span>
      <Clock data-icon="inline-end" />
    </PopoverTrigger>
  );
}
