import type { Accessor } from "solid-js";

/**
 * 滚动位置比较容差（0.5px）。
 *
 * 用于"是否已到达某个位置""锚点是否越过阅读线"这类比较：浏览器的小数滚动位置
 * 不可能精确相等，需要一个统一的容差，否则会出现"差 0.3px 算没到"的抖动。
 */
export const AT_EDGE_TOLERANCE = 0.5;

/**
 * `data-scrollable` 的取值：可向哪个边缘滚动，空格分隔的 token 列表
 * （`"start"` / `"end"` / `"start end"`），都不可滚时为 `undefined`
 * （可用 `[data-scrollable~="end"]` 查询单个方向，缺失表示内容放得下）。
 */
export function scrollableData(
  start: Accessor<boolean>,
  end: Accessor<boolean>,
): string | undefined {
  const tokens: string[] = [];
  if (start()) tokens.push("start");
  if (end()) tokens.push("end");
  return tokens.length > 0 ? tokens.join(" ") : undefined;
}
