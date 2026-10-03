import buttonVariants from "~/components/button/Button.styles";
import type { ButtonVariant } from "~/components/button/Button.types";
import { clsx } from "~/utils";
import { isDayDisabled } from "./Calendar.options";
import {
  isDateSelected,
  isRangeEnd,
  isRangeMiddle,
  isRangeStart,
} from "./Calendar.selection";
import type {
  CalendarClassNames,
  CalendarMode,
  CalendarSelected,
} from "./Calendar.types";
import { isSameDay } from "./Calendar.utils";

export interface CalendarDayProps {
  day: Date;
  /** 该天所属的展示月份（用于判断 outside/hidden） */
  monthDate: Date;
  mode: CalendarMode;
  selected: CalendarSelected;
  showOutsideDays: boolean;
  /** 缺省时用 Button 的默认变体 */
  buttonVariant?: ButtonVariant;
  /** 缺省时用运行环境的默认区域 */
  localeCode?: string;
  disabled?: boolean | ((date: Date) => boolean);
  min?: Date;
  max?: Date;
  /** 按插槽 key 取最终类名（默认值 + 调用方覆盖） */
  slotClass: (key: keyof CalendarClassNames) => string;
  onSelect: (day: Date) => void;
}

/**
 * 日历里的一格：根据 mode / selected / 边界推导出它自己的选中、区间与禁用状态，
 * 并落成 `data-*`（下游样式依赖）+ 一个原生按钮。
 *
 * 状态推导全部复用 `Calendar.options` / `Calendar.selection` 的纯函数，
 * 因此这一格不持有任何跨天的共享状态。
 */
export function CalendarDay(props: CalendarDayProps) {
  const isDisabled = () =>
    isDayDisabled(props.day, {
      disabled: props.disabled,
      min: props.min,
      max: props.max,
    });
  const isSelected = () =>
    isDateSelected(props.mode, props.selected, props.day);
  const isOutside = () => props.day.getMonth() !== props.monthDate.getMonth();
  const isRangeStartDay = () => isRangeStart(props.selected, props.day);
  const isRangeEndDay = () => isRangeEnd(props.selected, props.day);
  const isRangeMiddleDay = () => isRangeMiddle(props.selected, props.day);
  const isSingleSelected = () =>
    props.mode === "single" &&
    props.selected instanceof Date &&
    isSameDay(props.day, props.selected);

  return (
    <div
      aria-disabled={isDisabled()}
      data-selected={isSelected() ? "true" : undefined}
      class={clsx(
        props.slotClass("day"),
        isOutside() && props.slotClass("outside"),
        !props.showOutsideDays && isOutside() && props.slotClass("hidden"),
        isSameDay(props.day, new Date()) && props.slotClass("today"),
        isDisabled() && props.slotClass("disabled"),
        isRangeStartDay() && props.slotClass("range_start"),
        isRangeMiddleDay() && props.slotClass("range_middle"),
        isRangeEndDay() && props.slotClass("range_end"),
      )}
    >
      <button
        type="button"
        disabled={isDisabled()}
        aria-pressed={isSelected()}
        data-day={props.day.toLocaleDateString(props.localeCode)}
        data-selected-single={isSingleSelected() ? "true" : undefined}
        data-range-start={isRangeStartDay() ? "true" : undefined}
        data-range-end={isRangeEndDay() ? "true" : undefined}
        data-range-middle={isRangeMiddleDay() ? "true" : undefined}
        onClick={() => {
          if (!isDisabled()) props.onSelect(props.day);
        }}
        class={clsx(
          buttonVariants({ variant: props.buttonVariant }),
          "relative isolate z-10 flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 border-0 leading-none font-normal",
          "data-[range-end=true]:rounded-(--cell-radius) data-[range-end=true]:rounded-r-(--cell-radius) data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
          "data-[range-end=true]:hover:bg-primary data-[range-end=true]:hover:text-primary-foreground",
          "data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-muted data-[range-middle=true]:text-foreground",
          "data-[range-middle=true]:hover:bg-muted data-[range-middle=true]:hover:text-foreground",
          "data-[range-start=true]:rounded-(--cell-radius) data-[range-start=true]:rounded-l-(--cell-radius) data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground",
          "data-[range-start=true]:hover:bg-primary data-[range-start=true]:hover:text-primary-foreground",
          "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
          "data-[selected-single=true]:hover:bg-primary data-[selected-single=true]:hover:text-primary-foreground",
          isOutside() && "text-muted-foreground",
        )}
      >
        {props.day.getDate()}
      </button>
    </div>
  );
}
