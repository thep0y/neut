import { For, Show } from "solid-js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/select";
import { clsx } from "~/utils";
import type { MonthOption } from "./Calendar.options";
import type { CalendarClassNames } from "./Calendar.types";
import { formatMonthYear } from "./Calendar.utils";

export interface CalendarMonthCaptionProps {
  monthDate: Date;
  /** 缺省按 label（文本标题）处理 */
  captionLayout?: "label" | "dropdown";
  localeCode?: string;
  /** 当前年份下可选的月份（已按 min/max 过滤并本地化） */
  monthOptions: MonthOption[];
  /** 可选年份 */
  yearOptions: number[];
  /** 选择新的展示月份（已按所选月份/年份算好具体日期） */
  onSelectMonth: (next: Date) => void;
  slotClass: (key: keyof CalendarClassNames) => string;
}

/**
 * 月份标题：`captionLayout="label"` 时是一行文本，
 * `"dropdown"` 时换成"月 + 年"两个下拉。
 *
 * 下拉只负责"用户选了哪个值 → 对应的月份日期"，跨月状态仍由 Calendar 持有。
 */
export function CalendarMonthCaption(props: CalendarMonthCaptionProps) {
  return (
    <div class={props.slotClass("month_caption")}>
      <Show
        when={props.captionLayout === "dropdown"}
        fallback={
          <span class={props.slotClass("caption_label")}>
            {formatMonthYear(props.monthDate, props.localeCode)}
          </span>
        }
      >
        <div class={props.slotClass("dropdowns")}>
          <Select
            value={String(props.monthDate.getMonth())}
            onValueChange={(value) => {
              props.onSelectMonth(
                new Date(props.monthDate.getFullYear(), Number(value), 1),
              );
            }}
          >
            <SelectTrigger
              variant="ghost"
              class={clsx(
                "h-(--cell-size) rounded-(--cell-radius) px-2 text-sm font-medium",
                props.slotClass("dropdown_root"),
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent class="max-h-56">
              <For each={props.monthOptions}>
                {(option) => (
                  <SelectItem value={option.value}>{option.label}</SelectItem>
                )}
              </For>
            </SelectContent>
          </Select>

          <Select
            value={String(props.monthDate.getFullYear())}
            onValueChange={(value) => {
              props.onSelectMonth(
                new Date(Number(value), props.monthDate.getMonth(), 1),
              );
            }}
          >
            <SelectTrigger
              variant="ghost"
              class={clsx(
                "h-(--cell-size) rounded-(--cell-radius) px-2 text-sm font-medium tabular-nums",
                props.slotClass("dropdown_root"),
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent class="max-h-56">
              <For each={props.yearOptions}>
                {(year) => <SelectItem value={String(year)}>{year}</SelectItem>}
              </For>
            </SelectContent>
          </Select>
        </div>
      </Show>
    </div>
  );
}
