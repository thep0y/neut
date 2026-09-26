import { getAlignment, getSide, type Placement, type Side } from "~/lib";
import type {
  ContextMenuAlign,
  ContextMenuChangeEventDetails,
  ContextMenuChangeEventReason,
  ContextMenuSide,
} from "./context-menu.types";

type Dir = "ltr" | "rtl" | "auto" | undefined;

/** 逻辑方向 -> 物理方向(LTR 下 inline-start=left,inline-end=right;RTL 相反) */
function resolveLogicalSide(side: ContextMenuSide, dir: Dir): Side {
  const rtl = dir === "rtl";
  if (side === "inline-start") return rtl ? "right" : "left";
  if (side === "inline-end") return rtl ? "left" : "right";
  return side;
}

/**
 * 把 Base UI 风格的 `side` + `align` 拆成核心定位库统一的 `Placement`。
 * `align="center"` 时不带后缀(即居中)。
 */
export function toContextMenuPlacement(
  side: ContextMenuSide,
  align: ContextMenuAlign,
  dir: Dir,
): Placement {
  const physical = resolveLogicalSide(side, dir);
  return align === "center" ? physical : (`${physical}-${align}` as Placement);
}

/**
 * 根据最终生效的 placement 计算动画缩放原点(贴在锚点上的那个角)。
 * 逻辑与 Popover/Tooltip 保持一致。
 */
export function getContextMenuTransformOrigin(placement: Placement): string {
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

/**
 * 计算写回 DOM 的 `data-side`。若用户传入的是逻辑方向且最终没有翻转到另一侧,
 * 依旧回写逻辑值,这样 shadcn 的 `data-[side=inline-end]:...` 样式才能命中。
 */
export function resolveContextMenuDataSide(
  requested: ContextMenuSide,
  placement: Placement,
  dir: Dir,
): ContextMenuSide {
  const actual = getSide(placement);
  if (requested === "inline-start" || requested === "inline-end") {
    const expected = resolveLogicalSide(requested, dir);
    if (expected === actual) return requested;
  }
  return actual;
}

/** 生成对齐 Base UI 的 ChangeEventDetails */
export function createChangeEventDetails<
  R extends string = ContextMenuChangeEventReason,
>(
  reason: R,
  event?: Event,
  trigger?: Element,
): ContextMenuChangeEventDetails<R> {
  let canceled = false;
  let propagationAllowed = false;

  return {
    reason,
    event,
    trigger,
    cancel: () => {
      canceled = true;
    },
    allowPropagation: () => {
      propagationAllowed = true;
    },
    get isCanceled() {
      return canceled;
    },
    get isPropagationAllowed() {
      return propagationAllowed;
    },
  };
}
