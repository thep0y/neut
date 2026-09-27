import { createFloatingMiddleware, type Middleware } from "~/lib";

// 定位相关的纯函数已抽到 ~/lib/positioner/utils/floating,这里保留原有导出名,
// 避免 Tooltip 内部 import 变动。
export {
  toPhysicalSide,
  toPlacement,
  getTransformOrigin,
} from "~/lib";

export interface BuildTooltipMiddlewareOptions {
  sideOffset: number;
  /** 沿交叉轴(对齐方向)的偏移,对应 offset middleware 的 crossAxis */
  alignOffset: number;
  collisionPadding: number;
  arrowElement: () => Element | undefined;
}

/**
 * Tooltip 定位管线:offset → flip → shift → arrow → hide → containingBlockOffset。
 * 与 Popover/HoverCard 共用 createFloatingMiddleware,只多了 arrow。
 */
export function createTooltipMiddleware(
  options: BuildTooltipMiddlewareOptions,
): Middleware[] {
  return createFloatingMiddleware({
    sideOffset: options.sideOffset,
    alignOffset: options.alignOffset,
    collisionPadding: options.collisionPadding,
    arrowElement: options.arrowElement,
    arrowPadding: 6,
  });
}
