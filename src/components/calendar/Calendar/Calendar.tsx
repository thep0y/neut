import {
  For,
  createMemo,
  createSignal,
  mergeProps,
  splitProps,
  type JSX,
} from "solid-js";
import { clsx } from "~/utils";
import { CalendarMonth } from "./CalendarMonth";
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
} from "./Calendar.options";
import { nextSelected } from "./Calendar.selection";
import {
  addMonths,
  resolveInitialMonth,
  resolveLocaleCode,
  startOfMonth,
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

  return (
    <div
      data-slot="calendar"
      class={clsx(slotClass("root"), local.class)}
      classList={local.classList}
      style={local.style}
      dir={local.dir}
      {...rest}
    >
      <div class={slotClass("months")}>
        <For each={monthList()}>
          {(monthDate) => (
            <CalendarMonth
              monthDate={monthDate}
              canPrev={canPrev()}
              canNext={canNext()}
              onMoveMonth={moveMonth}
              captionLayout={merged.captionLayout}
              localeCode={localeCode()}
              monthOptions={monthOptions}
              yearOptions={yearOptions()}
              onSelectMonth={setMonth}
              showWeekNumber={merged.showWeekNumber}
              weekStartsOn={merged.weekStartsOn}
              mode={merged.mode}
              selected={selected()}
              showOutsideDays={merged.showOutsideDays}
              buttonVariant={merged.buttonVariant}
              disabled={merged.disabled}
              min={merged.min}
              max={merged.max}
              onSelectDay={selectDay}
              slotClass={slotClass}
            />
          )}
        </For>
      </div>
    </div>
  );
}

export { calendarClassNames } from "./Calendar.styles";
