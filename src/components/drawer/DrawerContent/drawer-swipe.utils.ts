import type { DrawerSwipeDirection } from "../Drawer/Drawer.types";

/** 触发拖拽关闭的位移占面板尺寸的比例阈值 */
export const DISMISS_RATIO = 0.3;
/** 阈值下限：面板很小时也要拖够这么多像素 */
export const DISMISS_MIN_PX = 80;

/**
 * 抽屉滑动关闭的判定与几何计算。
 *
 * 单一职责：只回答"能不能从这里起手""拖到多少算关闭""位移该被夹到哪个方向"。
 * 全部是纯函数或只读 DOM 的判定，不持有手势状态、不注册事件，
 * 因此可以用人造 DOM 精确驱动每个分支。
 */

/** 起手点是否落在可交互元素上（这些元素自己的指针行为不该被拖拽抢走） */
export function isInteractive(target: Element): boolean {
  return !!target.closest(
    "button, a, input, textarea, select, [role=button], [contenteditable], [data-drawer-no-swipe]",
  );
}

/** 找到 target 到 popup 之间最近的可滚动容器（沿拖拽轴判定） */
export function findScroller(
  target: Element,
  popup: HTMLElement,
  horizontal: boolean,
): HTMLElement | null {
  let node: Element | null = target;
  while (node && node !== popup) {
    const style = getComputedStyle(node);
    const overflow = horizontal ? style.overflowX : style.overflowY;
    const scrollable =
      /auto|scroll/.test(overflow) &&
      (horizontal
        ? node.scrollWidth > node.clientWidth
        : node.scrollHeight > node.clientHeight);
    if (scrollable) return node as HTMLElement;
    node = node.parentElement;
  }
  return null;
}

/** 滚动容器是否已经贴住"允许拖拽关闭"的那一侧 */
export function canDragFromScroller(
  scroller: HTMLElement,
  horizontal: boolean,
  dir: DrawerSwipeDirection,
): boolean {
  if (horizontal) {
    if (dir === "left") {
      return (
        scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1
      );
    }
    return scroller.scrollLeft <= 0;
  }
  if (dir === "down") return scroller.scrollTop <= 0;
  return (
    scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1
  );
}

/**
 * 手势能否从该起手点开始：
 * - 可交互元素上不起手；
 * - 显式的拖拽把手永远可以；
 * - 起手点在滚动容器内时，只有容器已经贴边才起手（否则让内容先滚）；
 * - 没有滚动容器则直接可以。
 */
export function canSwipeFrom(
  target: Element,
  popup: HTMLElement,
  horizontal: boolean,
  dir: DrawerSwipeDirection,
): boolean {
  if (isInteractive(target)) return false;
  if (target.closest('[data-slot="drawer-swipe-handle"]')) return true;

  const scroller = findScroller(target, popup, horizontal);
  if (!scroller) return true;
  return canDragFromScroller(scroller, horizontal, dir);
}

/** 关闭阈值：面板尺寸的比例，但不低于 DISMISS_MIN_PX */
export function resolveDismissThreshold(panelSize: number): number {
  return Math.max(DISMISS_MIN_PX, panelSize * DISMISS_RATIO);
}

/** 只允许沿"关闭方向"的位移：left/up 取负数侧，right/down 取正数侧 */
export function clampSwipeOffset(
  dir: DrawerSwipeDirection,
  delta: number,
): number {
  return dir === "left" || dir === "up"
    ? Math.min(0, delta)
    : Math.max(0, delta);
}

/** 位移是否足以关闭：必须沿关闭方向且超过阈值 */
export function isClosingSwipe(
  dir: DrawerSwipeDirection,
  delta: number,
  threshold: number,
): boolean {
  return (
    (dir === "down" && delta > threshold) ||
    (dir === "up" && -delta > threshold) ||
    (dir === "left" && -delta > threshold) ||
    (dir === "right" && delta > threshold)
  );
}
