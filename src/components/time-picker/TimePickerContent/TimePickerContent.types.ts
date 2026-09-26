import type { ParentProps } from "solid-js";
import type { PopoverSide } from "~/components/popover";
import type { BaseProps } from "~/types";

export interface TimePickerContentProps extends BaseProps, ParentProps {
  /** 贴触发器的哪一侧,默认 'bottom' */
  side?: PopoverSide;
  /** 水平对齐,默认 'start' */
  align?: "start" | "center" | "end";
  /** 与触发器之间的间距(像素) */
  sideOffset?: number;
}
