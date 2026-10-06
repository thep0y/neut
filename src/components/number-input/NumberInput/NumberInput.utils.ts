/**
 * 限制到 [min, max]（两者都可缺省）。
 *
 * 实现复用 `~/utils` 的 `clamp`（与 resizable 共用同一份边界逻辑）。
 */
export { clamp } from "~/utils";

/** 一个数的小数位数 */
export function decimalPlaces(value: number): number {
  const text = String(value);
  const index = text.indexOf(".");
  return index === -1 ? 0 : text.length - index - 1;
}

/** 按步长的小数位数四舍五入,抵消浮点误差(如 0.1 + 0.2) */
export function roundToStep(value: number, step: number): number {
  return Number(value.toFixed(decimalPlaces(step)));
}

/** 默认解析:接受十进制文本(",",作小数点也接受);空/非法返回 null */
export function defaultParseNumber(text: string): number | null {
  const normalized = text.trim().replace(/\s+/g, "").replace(/,/g, ".");
  if (
    normalized === "" ||
    normalized === "-" ||
    normalized === "." ||
    normalized === "-."
  ) {
    return null;
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** 默认格式化 */
export function defaultFormatNumber(value: number): string {
  return String(value);
}
