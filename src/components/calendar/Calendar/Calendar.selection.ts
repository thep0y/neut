/**
 * Calendar 的选中态算法。
 *
 * 单一职责：在「当前选中值 + 模式 + 日期」上做纯计算——
 * 某个日期是否被选中、是否落在范围区间内、点击后新的选中值是什么。
 * 不持有信号、不渲染，因此 `single` / `multiple` / `range` 三种模式的每个
 * 分支都能独立单测。
 */

import type {
  CalendarMode,
  CalendarSelected,
  DateRange,
} from "./Calendar.types";
import {
  isAfter,
  isAfterOrSame,
  isBefore,
  isBeforeOrSame,
  isSameDay,
} from "./Calendar.utils";

/** 把选中值收窄成区间（非区间模式会得到 undefined 字段） */
function asRange(selected: CalendarSelected): DateRange | undefined {
  if (!selected || selected instanceof Date || Array.isArray(selected)) {
    return undefined;
  }
  return selected;
}

/** 该日期是否是区间起点 */
export function isRangeStart(selected: CalendarSelected, day: Date): boolean {
  const range = asRange(selected);
  return !!range?.from && isSameDay(day, range.from);
}

/** 该日期是否是区间终点 */
export function isRangeEnd(selected: CalendarSelected, day: Date): boolean {
  const range = asRange(selected);
  return !!range?.to && isSameDay(day, range.to);
}

/** 该日期是否落在区间内部（不含两端） */
export function isRangeMiddle(selected: CalendarSelected, day: Date): boolean {
  const range = asRange(selected);
  return (
    !!range?.from &&
    !!range?.to &&
    isAfter(day, range.from) &&
    isBefore(day, range.to)
  );
}

/**
 * 该日期是否「处于选中状态」。
 * 注意 range 模式下区间内部的日期也算选中（用于 `aria-pressed` 与 `data-selected`）。
 */
export function isDateSelected(
  mode: CalendarMode,
  selected: CalendarSelected,
  day: Date,
): boolean {
  if (mode === "single") {
    return selected instanceof Date && isSameDay(day, selected);
  }
  if (mode === "multiple") {
    return Array.isArray(selected) && selected.some((d) => isSameDay(d, day));
  }
  const range = asRange(selected);
  if (!range) return false;
  if (range.from && isSameDay(day, range.from)) return true;
  if (range.to && isSameDay(day, range.to)) return true;
  return (
    !!range.from &&
    !!range.to &&
    isAfterOrSame(day, range.from) &&
    isBeforeOrSame(day, range.to)
  );
}

/** single 模式：再次点击已选日期则取消选中 */
function nextSingle(selected: CalendarSelected, day: Date): CalendarSelected {
  return selected instanceof Date && isSameDay(selected, day) ? undefined : day;
}

/** multiple 模式：在数组里切换该日期的存在性（保持原顺序追加） */
function nextMultiple(selected: CalendarSelected, day: Date): CalendarSelected {
  const list = Array.isArray(selected) ? [...selected] : [];
  const index = list.findIndex((d) => isSameDay(d, day));
  if (index >= 0) {
    list.splice(index, 1);
  } else {
    list.push(day);
  }
  return list;
}

/**
 * range 模式：第一次点击设起点，第二次点击形成区间；
 * - 点击早于起点的日期 → 交换成 `{ from: day, to: from }`
 * - 点击与起点同一天 → `{ from: day, to: day }`
 * - 已有完整区间 → 重新开始（只设 from）
 */
function nextRange(selected: CalendarSelected, day: Date): CalendarSelected {
  const range = asRange(selected);
  if (!range?.from || (range.from && range.to)) {
    return { from: day };
  }
  if (isBefore(day, range.from)) {
    return { from: day, to: range.from };
  }
  if (isSameDay(day, range.from)) {
    return { from: day, to: day };
  }
  return { from: range.from, to: day };
}

/**
 * 计算点击某一天之后的新选中值（不判断是否 disabled——调用方负责）。
 */
export function nextSelected(
  mode: CalendarMode,
  selected: CalendarSelected,
  day: Date,
): CalendarSelected {
  if (mode === "single") return nextSingle(selected, day);
  if (mode === "multiple") return nextMultiple(selected, day);
  return nextRange(selected, day);
}
