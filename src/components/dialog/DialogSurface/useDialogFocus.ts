import { type Accessor, createEffect, onCleanup } from "solid-js";

/** 只在浮层内部参与 Tab 循环的可聚焦元素。 */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * 模态 Dialog 的焦点边界：打开时记住焦点来源，关闭时还回去；
 * Tab / Shift+Tab 在浮层内首尾循环。
 *
 * 没有用 focusin 强制拉回焦点，是因为 Dialog 内可能嵌套 Select/Popover 等
 * Portal 浮层；它们在 DOM 上不在 surface 内，强行拉回会中断嵌套浮层。
 * 键盘 Tab 循环覆盖了主要的"焦点逃出模态框"路径。
 */
export function useDialogFocus(open: Accessor<boolean>) {
  let previousFocus: HTMLElement = document.body;

  const focus = (element: HTMLElement) => {
    element.focus({ preventScroll: true });
  };

  const focusable = (surface: HTMLElement): HTMLElement[] =>
    [...surface.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(
      (element) =>
        !element.hidden && element.getAttribute("aria-hidden") !== "true",
    );

  const restoreFocus = () => {
    const target = previousFocus;
    previousFocus = document.body;
    if (target !== document.body && target.isConnected) {
      focus(target);
    }
  };

  createEffect(() => {
    if (!open()) return;
    // 打开前的焦点可能落在 body（例如通过受控 open 直接打开）；
    // 关闭时不要主动把焦点抢回 body。
    previousFocus = (document.activeElement ?? document.body) as HTMLElement;
    onCleanup(restoreFocus);
  });

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Tab") return;

    const surface = event.currentTarget as HTMLElement;
    const items = focusable(surface);
    if (items.length === 0) {
      event.preventDefault();
      focus(surface);
      return;
    }

    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    const outside = !surface.contains(active);

    if (event.shiftKey) {
      if (active === surface || active === first || outside) {
        event.preventDefault();
        focus(last);
      }
      return;
    }

    if (active === surface || active === last || outside) {
      event.preventDefault();
      focus(first);
    }
  };

  return { handleKeyDown };
}
