import type { DrawerSwipeDirection } from "../Drawer/Drawer.types";

/** 关闭时把面板移出视口的方向 */
export function closedTransform(direction: DrawerSwipeDirection): string {
  switch (direction) {
    case "down":
      return "translate3d(0, 100%, 0)";
    case "up":
      return "translate3d(0, -100%, 0)";
    case "left":
      return "translate3d(-100%, 0, 0)";
    case "right":
      return "translate3d(100%, 0, 0)";
  }
}

export function isHorizontal(direction: DrawerSwipeDirection): boolean {
  return direction === "left" || direction === "right";
}

const axisStyles: Record<DrawerSwipeDirection, string> = {
  down: "inset-x-0 bottom-0 max-h-[calc(100dvh-6rem)]",
  up: "inset-x-0 top-0 max-h-[calc(100dvh-6rem)]",
  left: "inset-y-0 left-0 w-3/4 sm:w-96",
  right: "inset-y-0 right-0 w-3/4 sm:w-96",
};

/**
 * 面板默认在四周留白（`--drawer-inset`，默认 0.75rem），四角圆角 + 完整描边。
 * 想要 shadcn 那种贴边形态，传 `class="[--drawer-inset:0px]"` 并把对应边圆角置 0 即可。
 */
export const drawerPopupBase =
  "group/drawer-popup pointer-events-auto fixed z-50 m-(--drawer-inset,0.75rem) flex flex-col rounded-xl border bg-popover text-sm text-popover-foreground shadow-lg outline-none select-none data-[swipe-axis=x]:flex-row";

export function drawerPopupDirectionClass(direction: DrawerSwipeDirection) {
  return axisStyles[direction];
}
