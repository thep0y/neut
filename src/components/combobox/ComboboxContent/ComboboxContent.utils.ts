import type { Alignment, Placement, Side } from "~/lib";

export const toPlacement = (
  side: Side,
  align: "center" | Alignment,
): Placement => {
  return align === "center" ? side : `${side}-${align}`;
};
