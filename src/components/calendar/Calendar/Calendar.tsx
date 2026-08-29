import {
  For,
  Show,
  createMemo,
  createSignal,
  mergeProps,
  splitProps,
  type JSX,
} from "solid-js";
import { ChevronLeft, ChevronRight } from "lucide-solid";
import buttonVariants from "~/components/button/Button.styles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/select";
import { clsx } from "~/utils";
import type {
  CalendarClassNames,
  CalendarMode,
  CalendarProps,
  CalendarSelected,
  DateRange,
} from "./Calendar.types";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfWeek,
  formatMonthYear,
  formatWeekday,
  getFirstDate,
  getISOWeekNumber,
  isAfter,
  isAfterOrSame,
  isBefore,
  isBeforeOrSame,
  isSameDay,
  resolveLocaleCode,
  startOfMonth,
  startOfWeek,
} from "./Calendar.utils";

const defaultClassNames: Record<keyof CalendarClassNames, string> = {
  root: "group/calendar w-fit bg-background p-2 [--cell-radius:var(--radius-md)] [--cell-size:--spacing(7)] in-data-[slot=card-content]:bg-transparent in-data-[slot=popover-content]:bg-transparent",
  months: "relative flex flex-row gap-4",
  month: "relative flex w-full flex-col gap-4",
  nav: "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
  button_previous:
    "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
  button_next: "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
  month_caption:
    "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
  dropdowns:
    "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
  dropdown_root: "relative rounded-(--cell-radius)",
  dropdown: "absolute inset-0 bg-popover opacity-0",
  caption_label: "font-medium select-none text-sm",
  month_grid: "w-full border-collapse",
  weekdays: "flex",
  weekday:
    "flex-1 rounded-(--cell-radius) text-[0.8rem] font-normal text-muted-foreground select-none",
  week: "mt-2 flex w-full",
  week_number_header: "w-(--cell-size) select-none",
  week_number: "text-[0.8rem] text-muted-foreground select-none",
  day: "relative aspect-square h-full w-full rounded-(--cell-radius) p-0 text-center select-none [&:last-child[data-selected=true]_button]:rounded-r-(--cell-radius) [&:first-child[data-selected=true]_button]:rounded-l-(--cell-radius)",
  outside: "text-muted-foreground aria-selected:text-muted-foreground",
  disabled: "text-muted-foreground opacity-50",
  hidden: "invisible",
  today:
    "rounded-(--cell-radius) bg-muted text-foreground data-[selected=true]:rounded-none",
  range_start:
    "relative isolate z-0 rounded-l-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted",
  range_middle: "rounded-none",
  range_end:
    "relative isolate z-0 rounded-r-(--cell-radius) bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted",
};

function resolveInitialMonth(props: CalendarProps): Date {
  return (
    props.month ??
    props.defaultMonth ??
    getFirstDate(props.selected ?? props.defaultSelected) ??
    new Date()
  );
}

/**
 * 日历组件：react-day-picker 的 SolidJS 移植，覆盖 shadcn Base UI 版本
 * Calendar 中使用到的核心 props（mode/selected/onSelect/month/classNames 等）。
 * 支持 single、multiple、range 三种模式，以及 label/dropdown 两种标题布局。
 */
export function Calendar(props: CalendarProps): JSX.Element {
  const merged = mergeProps(
    {
      mode: "single" as CalendarMode,
      showOutsideDays: true,
      captionLayout: "label" as CalendarProps["captionLayout"],
      buttonVariant: "ghost" as CalendarProps["buttonVariant"],
      weekStartsOn: 0 as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      numberOfMonths: 1,
    },
    props,
  );

  const [local, rest] = splitProps(merged, [
    "mode",
    "selected",
    "defaultSelected",
    "onSelect",
    "month",
    "defaultMonth",
    "onMonthChange",
    "numberOfMonths",
    "showOutsideDays",
    "showWeekNumber",
    "weekStartsOn",
    "captionLayout",
    "locale",
    "buttonVariant",
    "classNames",
    "disabled",
    "min",
    "max",
    "class",
    "classList",
    "style",
    "dir",
  ]);

  const [internalSelected, setInternalSelected] =
    createSignal<CalendarSelected>(merged.defaultSelected);
  const selected = createMemo(() =>
    merged.selected !== undefined ? merged.selected : internalSelected(),
  );

  const commitSelected = (next: CalendarSelected) => {
    if (merged.selected === undefined) setInternalSelected(next);
    merged.onSelect?.(next);
  };

  const [internalMonth, setInternalMonth] = createSignal<Date>(
    startOfMonth(resolveInitialMonth(merged)),
  );
  const currentMonth = createMemo(() =>
    startOfMonth(merged.month ?? internalMonth()),
  );

  const setMonth = (next: Date) => {
    const value = startOfMonth(next);
    if (merged.month === undefined) setInternalMonth(value);
    merged.onMonthChange?.(value);
  };

  const moveMonth = (delta: number) =>
    setMonth(addMonths(currentMonth(), delta));

  const canPrev = () =>
    !merged.min ||
    isAfter(startOfMonth(currentMonth()), startOfMonth(merged.min));

  const canNext = () =>
    !merged.max ||
    isBefore(startOfMonth(currentMonth()), startOfMonth(merged.max));

  const monthList = createMemo(() => {
    const count = Math.max(1, merged.numberOfMonths ?? 1);
    return Array.from({ length: count }, (_, i) =>
      addMonths(currentMonth(), i),
    );
  });

  const localeCode = createMemo(() => resolveLocaleCode(merged.locale));

  const monthOptions = createMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(2024, i, 1);
      return {
        value: String(i),
        label: new Intl.DateTimeFormat(localeCode(), {
          month: "long",
        }).format(monthDate),
      };
    }),
  );

  const yearOptions = createMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 201 }, (_, i) => currentYear - 100 + i);
  });

  const slotClass = (key: keyof CalendarClassNames) =>
    clsx(defaultClassNames[key], merged.classNames?.[key]);

  const isDisabledDay = (day: Date) => {
    if (merged.disabled === true) return true;
    if (typeof merged.disabled === "function") return merged.disabled(day);
    if (merged.min && isBefore(day, merged.min)) return true;
    if (merged.max && isAfter(day, merged.max)) return true;
    return false;
  };

  const isRangeStart = (day: Date) => {
    const range = selected() as DateRange | undefined;
    return !!range?.from && isSameDay(day, range.from);
  };

  const isRangeEnd = (day: Date) => {
    const range = selected() as DateRange | undefined;
    return !!range?.to && isSameDay(day, range.to);
  };

  const isRangeMiddle = (day: Date) => {
    const range = selected() as DateRange | undefined;
    return (
      !!range?.from &&
      !!range?.to &&
      isAfter(day, range.from) &&
      isBefore(day, range.to)
    );
  };

  const isDateSelected = (day: Date) => {
    const value = selected();
    if (merged.mode === "single") {
      return value instanceof Date && isSameDay(day, value);
    }
    if (merged.mode === "multiple") {
      return Array.isArray(value) && value.some((d) => isSameDay(d, day));
    }
    const range = value as DateRange | undefined;
    return (
      !!range &&
      ((range.from && isSameDay(day, range.from)) ||
        (range.to && isSameDay(day, range.to)) ||
        (!!range.from &&
          !!range.to &&
          isAfterOrSame(day, range.from) &&
          isBeforeOrSame(day, range.to)))
    );
  };

  const selectDay = (day: Date) => {
    if (isDisabledDay(day)) return;

    if (merged.mode === "single") {
      const current = selected();
      commitSelected(
        current instanceof Date && isSameDay(current, day) ? undefined : day,
      );
      return;
    }

    if (merged.mode === "multiple") {
      const current = selected();
      const list = Array.isArray(current) ? [...current] : [];
      const index = list.findIndex((d) => isSameDay(d, day));
      if (index >= 0) list.splice(index, 1);
      else list.push(day);
      commitSelected(list);
      return;
    }

    const range = selected() as DateRange | undefined;
    if (!range?.from || (range.from && range.to)) {
      commitSelected({ from: day });
    } else if (isBefore(day, range.from)) {
      commitSelected({ from: day, to: range.from });
    } else if (isSameDay(day, range.from)) {
      commitSelected({ from: day, to: day });
    } else {
      commitSelected({ from: range.from, to: day });
    }
  };

  const renderDay = (day: Date, monthDate: Date) => {
    return (
      <div
        aria-disabled={isDisabledDay(day)}
        data-selected={isDateSelected(day) ? "true" : undefined}
        class={clsx(
          slotClass("day"),
          day.getMonth() !== monthDate.getMonth() && slotClass("outside"),
          !merged.showOutsideDays &&
            day.getMonth() !== monthDate.getMonth() &&
            slotClass("hidden"),
          isSameDay(day, new Date()) && slotClass("today"),
          isDisabledDay(day) && slotClass("disabled"),
          isRangeStart(day) && slotClass("range_start"),
          isRangeMiddle(day) && slotClass("range_middle"),
          isRangeEnd(day) && slotClass("range_end"),
        )}
      >
        <button
          type="button"
          disabled={isDisabledDay(day)}
          aria-pressed={isDateSelected(day)}
          data-day={day.toLocaleDateString(localeCode())}
          data-selected-single={
            merged.mode === "single" &&
            selected() instanceof Date &&
            isSameDay(day, selected() as Date)
              ? "true"
              : undefined
          }
          data-range-start={isRangeStart(day) ? "true" : undefined}
          data-range-end={isRangeEnd(day) ? "true" : undefined}
          data-range-middle={isRangeMiddle(day) ? "true" : undefined}
          onClick={() => selectDay(day)}
          class={clsx(
            buttonVariants({ variant: merged.buttonVariant }),
            "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-normal",
            "data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
            "data-[range-end=true]:hover:bg-primary data-[range-end=true]:hover:text-primary-foreground",
            "data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground",
            "data-[range-middle=true]:hover:bg-muted data-[range-middle=true]:hover:text-foreground",
            "data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
            "data-[range-start=true]:hover:bg-primary data-[range-start=true]:hover:text-primary-foreground",
            "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
            "data-[selected-single=true]:hover:bg-primary data-[selected-single=true]:hover:text-primary-foreground",
            day.getMonth() !== monthDate.getMonth() && "text-muted-foreground",
          )}
        >
          {day.getDate()}
        </button>
      </div>
    );
  };

  const renderMonth = (monthDate: Date) => {
    const firstDay = startOfMonth(monthDate);
    const lastDay = addDays(addMonths(monthDate, 1), -1);
    const gridStart = startOfWeek(firstDay, merged.weekStartsOn);
    const gridEnd = endOfWeek(lastDay, merged.weekStartsOn);
    const days = eachDayOfInterval(gridStart, gridEnd);
    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
      formatWeekday(addDays(gridStart, i), localeCode()),
    );

    return (
      <div class={slotClass("month")}>
        <div class={slotClass("nav")}>
          <button
            type="button"
            disabled={!canPrev()}
            aria-label="Previous month"
            onClick={() => moveMonth(-1)}
            class={clsx(
              buttonVariants({ variant: merged.buttonVariant }),
              slotClass("button_previous"),
            )}
          >
            <ChevronLeft class="size-4" />
          </button>
          <button
            type="button"
            disabled={!canNext()}
            aria-label="Next month"
            onClick={() => moveMonth(1)}
            class={clsx(
              buttonVariants({ variant: merged.buttonVariant }),
              slotClass("button_next"),
            )}
          >
            <ChevronRight class="size-4" />
          </button>
        </div>

        <div class={slotClass("month_caption")}>
          <Show
            when={merged.captionLayout === "dropdown"}
            fallback={
              <span class={slotClass("caption_label")}>
                {formatMonthYear(monthDate, localeCode())}
              </span>
            }
          >
            <div class={slotClass("dropdowns")}>
              <Select
                value={String(monthDate.getMonth())}
                onValueChange={(value) => {
                  setMonth(new Date(monthDate.getFullYear(), Number(value), 1));
                }}
              >
                <SelectTrigger
                  variant="ghost"
                  class={clsx(
                    "h-(--cell-size) rounded-(--cell-radius) px-2 text-sm font-medium",
                    slotClass("dropdown_root"),
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent class="max-h-56">
                  <For each={monthOptions()}>
                    {(option) => (
                      <SelectItem value={option.value}>
                        {option.label}
                      </SelectItem>
                    )}
                  </For>
                </SelectContent>
              </Select>

              <Select
                value={String(monthDate.getFullYear())}
                onValueChange={(value) => {
                  setMonth(new Date(Number(value), monthDate.getMonth(), 1));
                }}
              >
                <SelectTrigger
                  variant="ghost"
                  class={clsx(
                    "h-(--cell-size) rounded-(--cell-radius) px-2 text-sm font-medium tabular-nums",
                    slotClass("dropdown_root"),
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent class="max-h-56">
                  <For each={yearOptions()}>
                    {(year) => (
                      <SelectItem value={String(year)}>{year}</SelectItem>
                    )}
                  </For>
                </SelectContent>
              </Select>
            </div>
          </Show>
        </div>

        <div class={slotClass("month_grid")}>
          <div class={slotClass("weekdays")}>
            <Show when={merged.showWeekNumber}>
              <div class={slotClass("week_number_header")} />
            </Show>
            <For each={weekdayLabels}>
              {(label) => <div class={slotClass("weekday")}>{label}</div>}
            </For>
          </div>

          <For each={weeks}>
            {(week) => (
              <div class={slotClass("week")}>
                <Show when={merged.showWeekNumber}>
                  <div class={slotClass("week_number")}>
                    {getISOWeekNumber(week[0])}
                  </div>
                </Show>
                <For each={week}>{(day) => renderDay(day, monthDate)}</For>
              </div>
            )}
          </For>
        </div>
      </div>
    );
  };

  return (
    <div
      data-slot="calendar"
      class={clsx(slotClass("root"), local.class)}
      style={local.style}
      dir={local.dir}
      {...rest}
    >
      <div class={slotClass("months")}>
        <For each={monthList()}>{(monthDate) => renderMonth(monthDate)}</For>
      </div>
    </div>
  );
}

export { defaultClassNames as calendarClassNames };
