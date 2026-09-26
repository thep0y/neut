/** 默认比较：数字按大小，其余按本地化字符串 */
export function compareValues(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a ?? "").localeCompare(String(b ?? ""));
}

/** 默认过滤：大小写不敏感的 includes */
export function includesFilterValue(
  value: unknown,
  filterValue: unknown,
): boolean {
  return String(value ?? "")
    .toLowerCase()
    .includes(String(filterValue ?? "").toLowerCase());
}
