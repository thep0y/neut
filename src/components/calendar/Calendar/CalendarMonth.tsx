import { For, Show, createMemo } from "solid-js";
import { ChevronLeft, ChevronRight } from "lucide-solid";
import buttonVariants from "~/components/button/Button.styles";
import type { ButtonVariant } from "~/components/button/Button.types";
import { clsx } from "~/utils";
import type { MonthOption } from "./Calendar.options";
import { chunkIntoWeeks } from "./Calendar.options";
import type {
  CalendarClassNames,
  CalendarMode,
  CalendarSelected,
} from "./Calendar.types";
import { CalendarDay } from "./CalendarDay";
import { CalendarMonthCaption } from "./CalendarMonthCaption";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfWeek,
  formatWeekday,
  getISOWeekNumber,
  startOfMonth,
  startOfWeek,
} from "./Calendar.utils";

export interface CalendarMonthProps {
  monthDate: Date;
  /** 是否还能往前/往后翻月（由 Calendar 按 min/max 判定） */
  canPrev: boolean;
  canNext: boolean;
  onMoveMonth: (delta: number) => void;
  /** 缺省按 label（文本标题）处理 */
  captionLayout?: "label" | "dropdown";
  localeCode?: string;
  /** 某一年份下可选的月份 */
  monthOptions: (year: number) => MonthOption[];
  yearOptions: number[];
  onSelectMonth: (next: Date) => void;
  showWeekNumber?: boolean;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  mode: CalendarMode;
  selected: CalendarSelected;
  showOutsideDays: boolean;
  buttonVariant?: ButtonVariant;
  disabled?: boolean | ((date: Date) => boolean);
  min?: Date;
  max?: Date;
  onSelectDay: (day: Date) => void;
  slotClass: (key: keyof CalendarClassNames) => string;
}

/**
 * 一个月份的视图：翻月导航 + 标题（文本或下拉）+ 网格。
 *
 * 网格日期区间、周切分与星期表头都由纯函数算出来，本组件不持有跨月状态；
 * 每一格交给 `CalendarDay`，标题交给 `CalendarMonthCaption`。
 */
export function CalendarMonth(props: CalendarMonthProps) {
  // 网格区间与周切分只依赖 monthDate / weekStartsOn，做一次记忆化即可
  const gridStart = createMemo(() =>
    startOfWeek(startOfMonth(props.monthDate), props.weekStartsOn),
  );
  const days = createMemo(() =>
    eachDayOfInterval(
      gridStart(),
      endOfWeek(addDays(addMonths(props.monthDate, 1), -1), props.weekStartsOn),
    ),
  );
  const weeks = createMemo(() => chunkIntoWeeks(days()));
  const weekdayLabels = createMemo(() =>
    Array.from({ length: 7 }, (_, index) =>
      formatWeekday(addDays(gridStart(), index), props.localeCode),
    ),
  );

  return (
    <div class={props.slotClass("month")}>
      <div class={props.slotClass("nav")}>
        <button
          type="button"
          disabled={!props.canPrev}
          aria-label="Previous month"
          onClick={() => props.onMoveMonth(-1)}
          class={clsx(
            buttonVariants({ variant: props.buttonVariant }),
            props.slotClass("button_previous"),
          )}
        >
          <ChevronLeft class="size-4" />
        </button>
        <button
          type="button"
          disabled={!props.canNext}
          aria-label="Next month"
          onClick={() => props.onMoveMonth(1)}
          class={clsx(
            buttonVariants({ variant: props.buttonVariant }),
            props.slotClass("button_next"),
          )}
        >
          <ChevronRight class="size-4" />
        </button>
      </div>

      <CalendarMonthCaption
        monthDate={props.monthDate}
        captionLayout={props.captionLayout}
        localeCode={props.localeCode}
        monthOptions={props.monthOptions(props.monthDate.getFullYear())}
        yearOptions={props.yearOptions}
        onSelectMonth={props.onSelectMonth}
        slotClass={props.slotClass}
      />

      <div class={props.slotClass("month_grid")}>
        <div class={props.slotClass("weekdays")}>
          <Show when={props.showWeekNumber}>
            <div class={props.slotClass("week_number_header")} />
          </Show>
          <For each={weekdayLabels()}>
            {(label) => <div class={props.slotClass("weekday")}>{label}</div>}
          </For>
        </div>

        <For each={weeks()}>
          {(week) => (
            <div class={props.slotClass("week")}>
              <Show when={props.showWeekNumber}>
                <div class={props.slotClass("week_number")}>
                  {getISOWeekNumber(week[0])}
                </div>
              </Show>
              <For each={week}>
                {(day) => (
                  <CalendarDay
                    day={day}
                    monthDate={props.monthDate}
                    mode={props.mode}
                    selected={props.selected}
                    showOutsideDays={props.showOutsideDays}
                    buttonVariant={props.buttonVariant}
                    localeCode={props.localeCode}
                    disabled={props.disabled}
                    min={props.min}
                    max={props.max}
                    slotClass={props.slotClass}
                    onSelect={props.onSelectDay}
                  />
                )}
              </For>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
