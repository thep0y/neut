import type { CalendarSelected } from "./Calendar.types";

export function toDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function addDays(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isBefore(a: Date, b: Date): boolean {
  return toDateOnly(a).getTime() < toDateOnly(b).getTime();
}

export function isAfter(a: Date, b: Date): boolean {
  return toDateOnly(a).getTime() > toDateOnly(b).getTime();
}

export function isBeforeOrSame(a: Date, b: Date): boolean {
  return toDateOnly(a).getTime() <= toDateOnly(b).getTime();
}

export function isAfterOrSame(a: Date, b: Date): boolean {
  return toDateOnly(a).getTime() >= toDateOnly(b).getTime();
}

export function startOfWeek(date: Date, weekStartsOn = 0): Date {
  const day = toDateOnly(date);
  const diff = (day.getDay() - weekStartsOn + 7) % 7;
  return addDays(day, -diff);
}

export function endOfWeek(date: Date, weekStartsOn = 0): Date {
  return addDays(startOfWeek(date, weekStartsOn), 6);
}

export function eachDayOfInterval(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let current = toDateOnly(start);
  const last = toDateOnly(end);
  while (current.getTime() <= last.getTime()) {
    days.push(current);
    current = addDays(current, 1);
  }
  return days;
}

export function resolveLocaleCode(
  locale?: string | { code?: string },
): string | undefined {
  if (!locale) return undefined;
  return typeof locale === "string" ? locale : locale.code;
}

export function getFirstDate(selected: CalendarSelected): Date | undefined {
  if (selected instanceof Date) return selected;
  if (Array.isArray(selected)) return selected[0];
  if (selected?.from) return selected.from;
  if (selected?.to) return selected.to;
  return undefined;
}

export function formatWeekday(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(date);
}

export function formatMonthYear(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatMonthShort(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { month: "short" }).format(date);
}

export function getISOWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
