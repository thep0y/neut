import { onCleanup } from "solid-js";
import { useHoverCardContext } from "../hover-card.context";

interface Options {
  delay: () => number | undefined;
  closeDelay: () => number | undefined;
  disabled: () => boolean | undefined;
}

/**
 * Trigger 的悬停/聚焦行为:
 * - pointerenter/pointerleave 走 open/close 延迟(trigger 的 delay/closeDelay 优先于根);
 * - focus 跳过延迟立即打开(键盘可达),blur 立即关闭;
 * - Escape 关闭并阻止冒泡;
 * - 刚发生 pointerdown 时忽略紧随其后的 focus——点击一个可聚焦元素浏览器会
 *   自动 focus,不应因此把卡片打开。
 */
export function useHoverCardTrigger(options: Options) {
  const ctx = useHoverCardContext("HoverCardTrigger");

  const isDisabled = () => ctx.disabled() || !!options.disabled();

  const attachListeners = (el: Element) => {
    let pointerDown = false;

    const onPointerEnter = () => {
      if (isDisabled()) return;
      ctx.requestOpen(options.delay());
    };
    const onPointerLeave = () => {
      ctx.requestClose(options.closeDelay());
    };
    const onFocus = () => {
      if (pointerDown || isDisabled()) return;
      ctx.openImmediate();
    };
    const onBlur = () => {
      ctx.closeImmediate();
    };
    const onKeyDown = (event: Event) => {
      const keyboard = event as KeyboardEvent;
      if (keyboard.key === "Escape" && ctx.open()) {
        keyboard.stopPropagation();
        ctx.closeImmediate();
      }
    };
    const onMouseDown = () => {
      pointerDown = true;
    };
    const onDocumentMouseUp = () => {
      pointerDown = false;
    };

    el.addEventListener("pointerenter", onPointerEnter);
    el.addEventListener("pointerleave", onPointerLeave);
    el.addEventListener("focus", onFocus);
    el.addEventListener("blur", onBlur);
    el.addEventListener("keydown", onKeyDown);
    el.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onDocumentMouseUp);

    onCleanup(() => {
      el.removeEventListener("pointerenter", onPointerEnter);
      el.removeEventListener("pointerleave", onPointerLeave);
      el.removeEventListener("focus", onFocus);
      el.removeEventListener("blur", onBlur);
      el.removeEventListener("keydown", onKeyDown);
      el.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onDocumentMouseUp);
    });
  };

  return { ctx, attachListeners };
}
