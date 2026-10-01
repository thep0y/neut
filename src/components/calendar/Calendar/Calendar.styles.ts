import type { CalendarClassNames } from "./Calendar.types";

/**
 * 各插槽的默认 Tailwind 类名。与 shadcn 的 `calendar.tsx` 对齐，
 * 调用方可用 `classNames` 按 key 覆盖（见 `Calendar.tsx` 的 slotClass）。
 */
export const calendarClassNames: Record<keyof CalendarClassNames, string> = {
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

/** 兼容旧命名（对外公开的是 calendarClassNames） */
export { calendarClassNames as defaultClassNames };
