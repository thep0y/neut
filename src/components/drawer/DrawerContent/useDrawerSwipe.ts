import { createSignal, onCleanup } from "solid-js";
import { isHorizontal } from "./DrawerContent.styles";
import type {
  DrawerContextValue,
  DrawerSwipeDirection,
} from "../Drawer/Drawer.types";

/** 触发拖拽关闭的位移占面板尺寸的比例阈值 */
const DISMISS_RATIO = 0.3;
const DISMISS_MIN_PX = 80;

function isInteractive(target: Element): boolean {
  return !!target.closest(
    "button, a, input, textarea, select, [role=button], [contenteditable], [data-drawer-no-swipe]",
  );
}

/** 找到 target 到 popup 之间最近的纵向/横向滚动容器 */
function findScroller(
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

/** 面板是否已经贴住"允许拖拽关闭"的那一侧 */
function canDragFromScroller(
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
 * 基础拖拽关闭：pointerdown 起手 → 记录位移 → 抬起时超过阈值则关闭，否则回弹。
 * 从可交互元素起手、或内容还能继续滚动时不触发。
 */
export function useDrawerSwipe(ctx: DrawerContextValue) {
  const [dragging, setDragging] = createSignal(false);
  const [dragX, setDragX] = createSignal(0);
  const [dragY, setDragY] = createSignal(0);

  const direction = () => ctx.swipeDirection();
  const horizontal = () => isHorizontal(direction());

  const canStart = (target: Element, popup: HTMLElement) => {
    if (isInteractive(target)) return false;
    if (target.closest('[data-slot="drawer-swipe-handle"]')) return true;
    const scroller = findScroller(target, popup, horizontal());
    if (!scroller) return true;
    return canDragFromScroller(scroller, horizontal(), direction());
  };

  const attach = (popup: HTMLElement) => {
    let startX = 0;
    let startY = 0;

    const reset = () => {
      setDragging(false);
      setDragX(0);
      setDragY(0);
    };

    const finish = (event: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (!dragging()) return;

      const dir = direction();
      const panelSize = horizontal() ? popup.offsetWidth : popup.offsetHeight;
      const threshold = Math.max(DISMISS_MIN_PX, panelSize * DISMISS_RATIO);
      const delta = horizontal() ? dragX() : dragY();

      // 只有沿"关闭方向"的位移才算关闭
      const closing =
        (dir === "down" && delta > threshold) ||
        (dir === "up" && -delta > threshold) ||
        (dir === "left" && -delta > threshold) ||
        (dir === "right" && delta > threshold);

      if (closing) {
        setDragging(false);
        setDragX(0);
        setDragY(0);
        ctx.setOpen(false, "swipe", event);
      } else {
        reset();
      }
    };

    const onMove = (event: PointerEvent) => {
      if (!dragging()) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      const dir = direction();
      if (horizontal()) {
        setDragX(dir === "left" ? Math.min(0, dx) : Math.max(0, dx));
      } else {
        setDragY(dir === "up" ? Math.min(0, dy) : Math.max(0, dy));
      }
    };

    const onUp = (event: PointerEvent) => finish(event);

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target as Element | null;
      if (!target || !canStart(target, popup)) return;
      startX = event.clientX;
      startY = event.clientY;
      setDragging(true);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    };

    popup.addEventListener("pointerdown", onPointerDown);
    onCleanup(() => {
      popup.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    });
  };

  return { dragging, dragX, dragY, attach };
}
