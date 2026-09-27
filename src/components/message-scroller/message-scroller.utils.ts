import type { Accessor } from "solid-js";

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
