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
import { CalendarDay } from "./CalendarDay";
import { calendarClassNames } from "./Calendar.styles";
import type {
  CalendarClassNames,
  CalendarMode,
  CalendarProps,
  CalendarSelected,
} from "./Calendar.types";
import {
  buildMonthOptions,
  buildYearOptions,
  canMoveNext,
  canMovePrev,
  chunkIntoWeeks,
} from "./Calendar.options";
import { nextSelected } from "./Calendar.selection";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfWeek,
  formatMonthYear,
  formatWeekday,
  getISOWeekNumber,
  resolveInitialMonth,
  resolveLocaleCode,
  startOfMonth,
  startOfWeek,
} from "./Calendar.utils";

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

  const canPrev = () => canMovePrev(currentMonth(), merged.min);

  const canNext = () => canMoveNext(currentMonth(), merged.max);

  const monthList = createMemo(() => {
    const count = Math.max(1, merged.numberOfMonths ?? 1);
    return Array.from({ length: count }, (_, i) =>
      addMonths(currentMonth(), i),
    );
  });

  const localeCode = createMemo(() => resolveLocaleCode(merged.locale));

  /** 月份下拉项：按 locale 格式化月份名 */
  const monthOptions = (year: number) =>
    buildMonthOptions(year, { min: merged.min, max: merged.max }, (index) =>
      new Intl.DateTimeFormat(localeCode(), { month: "long" }).format(
        new Date(2024, index, 1),
      ),
    );

  const yearOptions = createMemo(() =>
    buildYearOptions(
      { min: merged.min, max: merged.max },
      new Date().getFullYear(),
    ),
  );

  const slotClass = (key: keyof CalendarClassNames) =>
    clsx(calendarClassNames[key], merged.classNames?.[key]);

  // 禁用判定由 CalendarDay 负责（它同时决定按钮 disabled 与点击是否生效），
  // 这里不再重复守卫：唯一调用方只会在可选的日期上回调。
  const selectDay = (day: Date) => {
    commitSelected(nextSelected(merged.mode, selected(), day));
  };

  const renderMonth = (monthDate: Date) => {
    const firstDay = startOfMonth(monthDate);
    const lastDay = addDays(addMonths(monthDate, 1), -1);
    const gridStart = startOfWeek(firstDay, merged.weekStartsOn);
    const gridEnd = endOfWeek(lastDay, merged.weekStartsOn);
    const days = eachDayOfInterval(gridStart, gridEnd);
    const weeks = chunkIntoWeeks(days);

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
                  <For each={monthOptions(monthDate.getFullYear())}>
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
                <For each={week}>
                  {(day) => (
                    <CalendarDay
                      day={day}
                      monthDate={monthDate}
                      mode={merged.mode}
                      selected={selected()}
                      showOutsideDays={merged.showOutsideDays}
                      buttonVariant={merged.buttonVariant}
                      localeCode={localeCode()}
                      disabled={merged.disabled}
                      min={merged.min}
                      max={merged.max}
                      slotClass={slotClass}
                      onSelect={selectDay}
                    />
                  )}
                </For>
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

export { calendarClassNames } from "./Calendar.styles";
