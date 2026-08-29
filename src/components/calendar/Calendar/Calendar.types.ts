import type { BaseProps } from "~/types";
import type { ButtonVariant } from "~/components/button/Button.types";

export type CalendarMode = "single" | "multiple" | "range";

export interface DateRange {
  from?: Date;
  to?: Date;
}

export type CalendarSelected = Date | Date[] | DateRange | undefined;

export interface CalendarClassNames {
  root?: string;
  months?: string;
  month?: string;
  nav?: string;
  button_previous?: string;
  button_next?: string;
  month_caption?: string;
  dropdowns?: string;
  dropdown_root?: string;
  dropdown?: string;
  caption_label?: string;
  month_grid?: string;
  weekdays?: string;
  weekday?: string;
  week?: string;
  week_number_header?: string;
  week_number?: string;
  day?: string;
  outside?: string;
  disabled?: string;
  hidden?: string;
  today?: string;
  range_start?: string;
  range_middle?: string;
  range_end?: string;
}

export interface CalendarProps extends BaseProps {
  /** 选择模式，默认 'single' */
  mode?: CalendarMode;
  /** 受控选中值；不传则内部自管理 */
  selected?: CalendarSelected;
  defaultSelected?: CalendarSelected;
  onSelect?: (selected: CalendarSelected) => void;
  /** 受控展示月份；不传则内部自管理 */
  month?: Date;
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  numberOfMonths?: number;
  showOutsideDays?: boolean;
  showWeekNumber?: boolean;
  /** 一周从周几开始，0=周日，1=周一，默认 0 */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  captionLayout?: "label" | "dropdown";
  /** 与 react-day-picker 的 Locale 类似，支持 Intl 字符串或 { code } 对象 */
  locale?: string | { code?: string };
  buttonVariant?: ButtonVariant;
  classNames?: Partial<CalendarClassNames>;
  disabled?: boolean | ((date: Date) => boolean);
  min?: Date;
  max?: Date;
}
