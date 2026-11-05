import type { Rect } from "@neut/positioner";

/** 构造 positioner 测试需要的矩形；Select 测试也复用这个最小 helper。 */
export function rect(
  x: number,
  y: number,
  width: number,
  height: number,
): Rect {
  return { x, y, width, height };
}
