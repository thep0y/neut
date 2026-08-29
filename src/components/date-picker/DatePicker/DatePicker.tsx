import {
  createMemo,
  createSignal,
  mergeProps,
  splitProps,
  type JSX,
} from "solid-js";
import { ChevronDown } from "lucide-solid";
import { Calendar } from "~/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/popover";
import { clsx } from "~/utils";
import type { DatePickerProps } from "./DatePicker.types";

function defaultFormatDate(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Date Picker：shadcn Base UI 版本 Date Picker 的 SolidJS 移植。
 *
 * shadcn 的 Base UI Date Picker 本身不是单个 Root 组件，而是由 Popover + Calendar
 * 组合而成。这里把它封装成一个开箱即用的 <DatePicker>，底层仍使用本仓库的
 * <Popover> 和 <Calendar>；如果你想完全复刻 shadcn 的「组合式」用法，也可以直接
 * 绕过这个封装，自己写 Popover + Calendar。
 */
export function DatePicker(props: DatePickerProps): JSX.Element {
  const merged = mergeProps(
    {
      placeholder: "Pick a date",
      align: "start" as const,
      side: "bottom" as const,
    },
    props,
  );

  const [local, rest] = splitProps(merged, [
    "value",
    "defaultValue",
    "onValueChange",
    "placeholder",
    "disabled",
    "min",
    "max",
    "locale",
    "formatDate",
    "showOutsideDays",
    "weekStartsOn",
    "captionLayout",
    "buttonVariant",
    "classNames",
    "side",
    "align",
    "sideOffset",
    "contentClass",
    "calendarClass",
    "class",
    "classList",
    "style",
  ]);

  const [internalValue, setInternalValue] = createSignal<Date | undefined>(
    local.defaultValue,
  );
  const [open, setOpen] = createSignal(false);
  const value = createMemo(() =>
    local.value !== undefined ? local.value : internalValue(),
  );

  const setValue = (date: Date | undefined) => {
    if (local.value === undefined) setInternalValue(date);
    local.onValueChange?.(date);
  };

  const localeCode = createMemo(() =>
    typeof local.locale === "string" ? local.locale : local.locale?.code,
  );

  const displayText = createMemo(() => {
    const date = value();
    if (!date) return local.placeholder;
    return (local.formatDate ?? defaultFormatDate)(date, localeCode());
  });

  return (
    <Popover open={open()} onOpenChange={setOpen}>
      <PopoverTrigger
        variant="outline"
        disabled={local.disabled}
        data-empty={value() === undefined ? "true" : undefined}
        class={clsx(
          "w-53 justify-between text-left font-normal",
          "data-[empty=true]:text-muted-foreground",
          local.class,
        )}
      >
        <span class="truncate">{displayText()}</span>
        <ChevronDown data-icon="inline-end" />
      </PopoverTrigger>
      <PopoverContent
        side={local.side}
        align={local.align}
        sideOffset={local.sideOffset}
        class={clsx("w-auto p-0", local.contentClass)}
      >
        <Calendar
          mode="single"
          selected={value()}
          onSelect={(date) => {
            setValue(date as Date | undefined);
            // 选完日期后关闭浮层，交互上和常见 DatePicker 一致。
            // shadcn 原始示例由 Popover 自己保持打开，用户可按需改写。
            setOpen(false);
          }}
          defaultMonth={value()}
          min={local.min}
          max={local.max}
          showOutsideDays={local.showOutsideDays}
          weekStartsOn={local.weekStartsOn}
          captionLayout={local.captionLayout}
          buttonVariant={local.buttonVariant}
          locale={local.locale}
          classNames={local.classNames}
          class={local.calendarClass}
          {...rest}
        />
      </PopoverContent>
    </Popover>
  );
}
