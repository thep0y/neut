import type { BaseProps } from "~/types";
import type { CalendarClassNames, CalendarProps } from "~/components/calendar";
import type { PopoverSide } from "~/components/popover";

export interface DatePickerProps extends BaseProps {
  /** 受控选中日期；不传则内部自管理（非受控模式） */
  value?: Date | undefined;
  /** 非受控模式下的初始选中日期 */
  defaultValue?: Date | undefined;
  onValueChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: Date;
  max?: Date;
  /** 传给 Calendar 的 locale */
  locale?: CalendarProps["locale"];
  /** 自定义格式化函数；默认用 Intl 输出「2025年4月29日」这类长日期 */
  formatDate?: (date: Date) => string;
  showOutsideDays?: boolean;
  weekStartsOn?: CalendarProps["weekStartsOn"];
  captionLayout?: CalendarProps["captionLayout"];
  buttonVariant?: CalendarProps["buttonVariant"];
  classNames?: Partial<CalendarClassNames>;
  /** PopoverContent 相对 trigger 的位置，默认 'bottom' */
  side?: PopoverSide;
  /** PopoverContent 水平对齐方式，默认 'start' */
  align?: "start" | "center" | "end";
  sideOffset?: number;
  /** PopoverContent 的 class */
  contentClass?: string;
  /** Calendar 根节点的 class */
  calendarClass?: string;
}
