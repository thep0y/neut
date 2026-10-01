import type { JSX } from "solid-js";
import type { Position, SwipeDirection } from "../Toast/Toast.types";
import type { Offset } from "./Toaster.types";

const VIEWPORT_OFFSET = "24px";
const MOBILE_VIEWPORT_OFFSET = "16px";

export function getPositionClass(position: Position): string {
  switch (position) {
    case "top-left":
      return "top-0 left-0";
    case "top-right":
      return "top-0 right-0";
    case "top-center":
      return "top-0 left-1/2 -translate-x-1/2";
    case "bottom-left":
      return "bottom-0 left-0";
    case "bottom-right":
      return "bottom-0 right-0";
    case "bottom-center":
      return "bottom-0 left-1/2 -translate-x-1/2";
  }
}

function toPx(value: string | number): string {
  return typeof value === "number" ? `${value}px` : value;
}

export function resolveOffsetStyle(
  position: Position,
  offset?: Offset,
  mobileOffset?: Offset,
): JSX.CSSProperties {
  const style: JSX.CSSProperties = {};
  const [y, x] = position.split("-");

  const normalize = (value: Offset | undefined, fallback: string) =>
    typeof value === "object" && value !== null
      ? value
      : {
          top: value ?? fallback,
          right: value ?? fallback,
          bottom: value ?? fallback,
          left: value ?? fallback,
        };

  const desktop = normalize(offset, VIEWPORT_OFFSET);
  const mobile = normalize(mobileOffset, MOBILE_VIEWPORT_OFFSET);

  if (y === "top") {
    style.top = toPx(desktop.top ?? VIEWPORT_OFFSET);
    style["--mobile-offset-top"] = toPx(mobile.top ?? MOBILE_VIEWPORT_OFFSET);
  } else {
    style.bottom = toPx(desktop.bottom ?? VIEWPORT_OFFSET);
    style["--mobile-offset-bottom"] = toPx(
      mobile.bottom ?? MOBILE_VIEWPORT_OFFSET,
    );
  }

  if (x === "left") {
    style.left = toPx(desktop.left ?? VIEWPORT_OFFSET);
    style["--mobile-offset-left"] = toPx(mobile.left ?? MOBILE_VIEWPORT_OFFSET);
  } else if (x === "right") {
    style.right = toPx(desktop.right ?? VIEWPORT_OFFSET);
    style["--mobile-offset-right"] = toPx(
      mobile.right ?? MOBILE_VIEWPORT_OFFSET,
    );
  }

  return style;
}

/**
 * 根据位置推导默认的滑动关闭方向。
 *
 * `Position` 的第二段可能是 `"center"`，而它**不是**合法的 `SwipeDirection`
 * （只有 top/right/bottom/left）。之前实现直接把它 `as SwipeDirection` 塞进结果，
 * 导致 `top-center` 会产出 `["top", "center"]` —— 调用方按方向匹配手势时
 * 永远命中不了 `"center"`，等于多了一个无效方向。
 * 这里按白名单过滤，保证返回的每一项都是真正可用的方向。
 */
export function getDefaultSwipeDirections(
  position: Position,
): SwipeDirection[] {
  const [y, x] = position.split("-");
  const directions: SwipeDirection[] = [];
  if (y === "top" || y === "bottom") directions.push(y);
  // 只有 left / right 能滑动关闭；center 位置没有水平滑动方向
  if (x === "left" || x === "right") directions.push(x);
  return directions;
}

export function getDocumentDirection(): "rtl" | "ltr" | "auto" {
  if (typeof document === "undefined") return "ltr";
  const dir = document.documentElement.getAttribute("dir");
  if (dir === "auto" || !dir) {
    return getComputedStyle(document.documentElement).direction as
      | "rtl"
      | "ltr"
      | "auto";
  }
  return dir as "rtl" | "ltr" | "auto";
}
