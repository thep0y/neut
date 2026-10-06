import { createSignal, onCleanup } from "solid-js";
import { isHorizontal } from "./DrawerContent.styles";
import {
  canSwipeFrom,
  clampSwipeOffset,
  isClosingSwipe,
  resolveDismissThreshold,
} from "./drawer-swipe.utils";
import type { DrawerContextValue } from "../Drawer/Drawer.types";

/**
 * 基础拖拽关闭：pointerdown 起手 → 记录位移 → 抬起时超过阈值则关闭，否则回弹。
 * 从可交互元素起手、或内容还能继续滚动时不触发。
 *
 * 起手判定、阈值与位移夹取都在 `drawer-swipe.utils`，本 hook 只负责
 * 信号、事件接线与生命周期清理。
 */
export function useDrawerSwipe(ctx: DrawerContextValue) {
  const [dragging, setDragging] = createSignal(false);
  const [dragX, setDragX] = createSignal(0);
  const [dragY, setDragY] = createSignal(0);

  const direction = () => ctx.swipeDirection();
  const horizontal = () => isHorizontal(direction());

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
      const threshold = resolveDismissThreshold(panelSize);
      const delta = horizontal() ? dragX() : dragY();

      // 只有沿"关闭方向"的位移才算关闭
      if (isClosingSwipe(dir, delta, threshold)) {
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
      const dir = direction();
      if (horizontal()) {
        setDragX(clampSwipeOffset(dir, event.clientX - startX));
      } else {
        setDragY(clampSwipeOffset(dir, event.clientY - startY));
      }
    };

    const onUp = (event: PointerEvent) => finish(event);

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target as Element | null;
      if (!target || !canSwipeFrom(target, popup, horizontal(), direction())) {
        return;
      }
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
