/**
 * Calendar 的日期可用性与下拉选项计算。
 *
 * 单一职责：纯函数地判断「某天能不能选」，以及生成月份/年份下拉的选项列表。
 * 不持有信号、不渲染，因此 `min` / `max` / `disabled` 的每种组合都能独立单测。
 */

import { isAfter, isBefore } from "./Calendar.utils";

/** `disabled` prop 的三种形态 */
export type CalendarDisabled = boolean | ((day: Date) => boolean) | undefined;

export interface DateBounds {
  min?: Date;
  max?: Date;
}

/**
 * 某天是否不可选。
 * 优先级：`disabled === true` > `disabled(day)` 函数 > `min` / `max` 区间。
 */
export function isDayDisabled(
  day: Date,
  { disabled, min, max }: DateBounds & { disabled?: CalendarDisabled },
): boolean {
  if (disabled === true) return true;
  if (typeof disabled === "function") return disabled(day);
  if (min && isBefore(day, min)) return true;
  if (max && isAfter(day, max)) return true;
  return false;
}

export interface MonthOption {
  /** 0–11 的月份索引字符串（直接给 Select 当 value） */
  value: string;
  /** 已按 locale 格式化过的月份名 */
  label: string;
}

/**
 * 生成某一年里可选的月份下拉项：落在 `min` / `max` 之外的月份被过滤掉。
 * 传入的 `format` 用于本地化月份名（调用方注入，避免这里依赖 Intl 配置）。
 */
export function buildMonthOptions(
  year: number,
  bounds: DateBounds,
  format: (monthIndex: number) => string,
): MonthOption[] {
  const { min, max } = bounds;
  return Array.from({ length: 12 }, (_, index) => index)
    .filter((index) => {
      const beforeMin =
        !!min &&
        (year < min.getFullYear() ||
          (year === min.getFullYear() && index < min.getMonth()));
      const afterMax =
        !!max &&
        (year > max.getFullYear() ||
          (year === max.getFullYear() && index > max.getMonth()));
      return !beforeMin && !afterMax;
    })
    .map((index) => ({ value: String(index), label: format(index) }));
}

/**
 * 生成年份下拉项：有 `min` / `max` 时夹到其年份，否则以前后 100 年为范围。
 * `max < min` 时返回空数组（不产生负数长度）。
 */
export function buildYearOptions(
  bounds: DateBounds,
  currentYear: number,
  span = 100,
): number[] {
  const startYear = bounds.min ? bounds.min.getFullYear() : currentYear - span;
  const endYear = bounds.max ? bounds.max.getFullYear() : currentYear + span;
  return Array.from(
    { length: Math.max(0, endYear - startYear + 1) },
    (_, i) => startYear + i,
  );
}

/** 是否还能往前翻月（`min` 已到达或超过当前月时不能） */
export function canMovePrev(
  currentMonth: Date,
  min: Date | undefined,
): boolean {
  if (!min) return true;
  const current = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );
  const floor = new Date(min.getFullYear(), min.getMonth(), 1);
  return current.getTime() > floor.getTime();
}

/** 是否还能往后翻月（`max` 已到达或早于当前月时不能） */
export function canMoveNext(
  currentMonth: Date,
  max: Date | undefined,
): boolean {
  if (!max) return true;
  const current = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );
  const ceiling = new Date(max.getFullYear(), max.getMonth(), 1);
  return current.getTime() < ceiling.getTime();
}

/**
 * 把一段连续的日期切成「周列表」（每 7 天一组，最后不足 7 天也保留）。
 */
export function chunkIntoWeeks(days: Date[]): Date[][] {
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}
