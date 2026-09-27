import {
  getAlignment,
  getSide,
  type Alignment,
  type Placement,
  type Side,
} from "~/lib";
import type { HoverCardSide } from "./hover-card.types";

function toPhysicalSide(side: HoverCardSide, dir?: string): Side {
  if (side === "inline-start") return dir === "rtl" ? "right" : "left";
  if (side === "inline-end") return dir === "rtl" ? "left" : "right";
  return side;
}

/** shadcn/Radix 的 side + align 组合成核心库的 Placement */
export function toPlacement(
  side: HoverCardSide,
  align: Alignment | "center",
  dir?: string,
): Placement {
  const physical = toPhysicalSide(side, dir);
  return align === "center" ? physical : (`${physical}-${align}` as Placement);
}

/** 缩放动画锚点落在贴近 trigger 的那条边 */
export function getTransformOrigin(placement: Placement): string {
  const side = getSide(placement);
  const align = getAlignment(placement);
  const cross = align === "start" ? "0%" : align === "end" ? "100%" : "50%";
  switch (side) {
    case "top":
      return `${cross} 100%`;
    case "bottom":
      return `${cross} 0%`;
    case "left":
      return `100% ${cross}`;
    case "right":
      return `0% ${cross}`;
  }
}
