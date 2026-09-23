import { onCleanup } from "solid-js";
import { useContextMenuContext } from "../ContextMenu/ContextMenu.context";

/** 触摸长按唤起菜单的时间阈值(毫秒),与 Base UI 保持一致 */
const LONG_PRESS_DELAY = 500;
/** 长按期间允许的手指抖动距离(像素),超过即取消 */
const LONG_PRESS_MOVE_TOLERANCE = 10;

export interface UseContextMenuTriggerResult {
  ctx: ReturnType<typeof useContextMenuContext>;
  /**
   * 把右键 / 长按 / 键盘唤起菜单的原生事件绑定到真正的 DOM 元素上(通过 ref 调用)。
   * 用 addEventListener 而不是 JSX 的 onXxx prop,是为了不占用这些 prop 名——
   * 调用方可以在触发器上自由传自己的 `onClick` / `onContextMenu`,两者互不覆盖。
   * 这与 TooltipTrigger 是同一套约定。
   */
  attachListeners: (el: Element) => void;
}

/**
 * 封装 ContextMenuTrigger 需要绑定的所有事件逻辑:
 * - contextmenu(右键):锚定到鼠标坐标
 * - pointerdown(触摸/手写笔)后持续 500ms 视为长按,锚定到按下坐标;抖动超过
 *   阈值、抬起或取消都会撤销
 * - keydown(Shift+F10 / 菜单键):锚定到触发器中心,满足键盘可达性
 *
 * 事件直接绑在 `el` 上,不依赖具体标签类型,因此触发器可以多态渲染成
 * div / button / 任意组件。回调参数统一声明为 `Event` 再在内部收窄,
 * 这是为了兼容 `Element.addEventListener` 的重载(与 TooltipTrigger 一致)。
 */
export function useContextMenuTrigger(): UseContextMenuTriggerResult {
  const ctx = useContextMenuContext("ContextMenuTrigger");

  const attachListeners = (el: Element) => {
    let longPressTimer: number | undefined;
    let pressOrigin: { x: number; y: number } | undefined;

    const clearLongPress = () => {
      if (longPressTimer !== undefined) {
        window.clearTimeout(longPressTimer);
        longPressTimer = undefined;
      }
    };

    const onContextMenu = (event: Event) => {
      if (ctx.disabled()) return;
      const e = event as MouseEvent;
      e.preventDefault();
      ctx.openAt(e.clientX, e.clientY, el, e, "trigger-press");
    };

    const onPointerDown = (event: Event) => {
      const e = event as PointerEvent;
      // 鼠标右键由 contextmenu 处理,这里只负责触摸/手写笔长按
      if (e.pointerType === "mouse" || ctx.disabled()) return;
      pressOrigin = { x: e.clientX, y: e.clientY };
      clearLongPress();
      longPressTimer = window.setTimeout(() => {
        longPressTimer = undefined;
        ctx.openAt(e.clientX, e.clientY, el, e, "trigger-press");
      }, LONG_PRESS_DELAY);
    };

    const onPointerMove = (event: Event) => {
      if (!pressOrigin || longPressTimer === undefined) return;
      const e = event as PointerEvent;
      const dx = e.clientX - pressOrigin.x;
      const dy = e.clientY - pressOrigin.y;
      if (Math.hypot(dx, dy) > LONG_PRESS_MOVE_TOLERANCE) clearLongPress();
    };

    const onPointerEnd = () => {
      pressOrigin = undefined;
      clearLongPress();
    };

    const onKeyDown = (event: Event) => {
      if (ctx.disabled()) return;
      const e = event as KeyboardEvent;
      const isMenuKey =
        e.key === "ContextMenu" || (e.shiftKey && e.key === "F10");
      if (!isMenuKey) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      ctx.openAt(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        el,
        e,
        "trigger-press",
      );
    };

    el.addEventListener("contextmenu", onContextMenu);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerEnd);
    el.addEventListener("pointercancel", onPointerEnd);
    el.addEventListener("keydown", onKeyDown);

    onCleanup(() => {
      clearLongPress();
      el.removeEventListener("contextmenu", onContextMenu);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerEnd);
      el.removeEventListener("pointercancel", onPointerEnd);
      el.removeEventListener("keydown", onKeyDown);
    });
  };

  return { ctx, attachListeners };
}
