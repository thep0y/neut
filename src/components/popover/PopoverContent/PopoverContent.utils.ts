import {
  containingBlockOffset,
  flip,
  getAlignment,
  getSide,
  hide,
  offset,
  shift,
  type Middleware,
  type Placement,
} from "~/lib";
import type { PopoverSide } from "./PopoverContent.types";

/**
 * 把 shadcn/Base UI 风格的 side + align 拆分参数转换成核心库统一用的
 * `Placement` 字符串。Base UI 额外支持 inline-start / inline-end 逻辑方向，
 * 这里简单按 LTR 映射（inline-start -> left, inline-end -> right）。
 */
export function toPopoverPlacement(
  side: PopoverSide,
  align: "start" | "end" | "center",
): Placement {
  const physical =
    side === "inline-start" ? "left" : side === "inline-end" ? "right" : side;
  return align === "center" ? physical : (`${physical}-${align}` as Placement);
}

/** 根据最终生效的 placement 计算缩放动画的 transform-origin。 */
export function getPopoverTransformOrigin(placement: Placement): string {
  const side = getSide(placement);
  const align = getAlignment(placement);
  const crossAxisOrigin =
    align === "start" ? "0%" : align === "end" ? "100%" : "50%";

  switch (side) {
    case "top":
      return `${crossAxisOrigin} 100%`;
    case "bottom":
      return `${crossAxisOrigin} 0%`;
    case "left":
      return `100% ${crossAxisOrigin}`;
    case "right":
      return `0% ${crossAxisOrigin}`;
  }
}

export interface BuildPopoverMiddlewareOptions {
  sideOffset: number;
  alignOffset: number;
  collisionPadding: number;
}

/**
 * Popover 定位管线：offset → flip → shift → hide → containingBlockOffset。
 * 和 Tooltip 相比只少了 arrow middleware，其余策略一致。
 */
export function createPopoverMiddleware(
  options: BuildPopoverMiddlewareOptions,
): Middleware[] {
  return [
    offset({ mainAxis: options.sideOffset, crossAxis: options.alignOffset }),
    flip(),
    shift({ padding: options.collisionPadding }),
    hide(),
    containingBlockOffset(),
  ];
}
