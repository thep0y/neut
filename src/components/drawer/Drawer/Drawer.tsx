import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
  type JSX,
} from "solid-js";
import { useScrollLock } from "~/hooks";
import { DrawerContext } from "./Drawer.context";
import { createDrawerChangeEventDetails } from "./create-change-event-details";
import type { DrawerProps } from "./Drawer.types";

/**
 * Drawer 根组件：不渲染 DOM，负责开关状态、modal 锁滚动与外部交互，
 * 通过 context 驱动 Trigger/Content 等子部件。
 */
export function Drawer(props: DrawerProps): JSX.Element {
  const [internalOpen, setInternalOpen] = createSignal(
    props.defaultOpen ?? false,
  );
  const open = createMemo(() =>
    props.open !== undefined ? props.open : internalOpen(),
  );
  const [show, setShow] = createSignal(open());

  const modal = createMemo(() => props.modal ?? true);
  const swipeDirection = createMemo(() => props.swipeDirection ?? "down");
  const showSwipeHandle = createMemo(() => props.showSwipeHandle === true);
  const disablePointerDismissal = createMemo(
    () => props.disablePointerDismissal === true,
  );

  const [trigger, setTrigger] = createSignal<HTMLElement>();
  const [popup, setPopup] = createSignal<HTMLElement>();
  const [titleId, setTitleId] = createSignal<string>();
  const [descriptionId, setDescriptionId] = createSignal<string>();
  const contentId = `drawer-content-${createUniqueId()}`;

  // 打开时立刻挂载；关闭时保留到退场动画结束（由 Content 的 transitionend 收尾）
  createEffect(() => {
    if (open()) setShow(true);
  });

  const restoreFocus = () => {
    const el = trigger();
    if (el && typeof el.focus === "function") {
      el.focus({ preventScroll: true });
    }
  };

  const setOpen = (
    next: boolean,
    reason: Parameters<typeof createDrawerChangeEventDetails>[0],
    event?: Event,
  ) => {
    if (next === open() && next) return;
    const details = createDrawerChangeEventDetails(reason, event, trigger());
    if (props.open === undefined) setInternalOpen(next);
    props.onOpenChange?.(next, details);
  };

  // Modal 打开时锁定页面滚动，浮层内部仍可滚动
  useScrollLock(() => open() && modal(), {
    allowedSelector: '[data-slot="drawer-popup"]',
  });

  // 打开期间：Esc 关闭 +（非 disablePointerDismissal）点击外部关闭
  createEffect(() => {
    if (!open()) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false, "escape-key", e);
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (disablePointerDismissal()) return;
      const target = e.target as Node | null;
      if (popup()?.contains(target)) return;
      if (trigger()?.contains(target)) return;
      setOpen(false, "outside-press", e);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown, true);
    onCleanup(() => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
    });
  });

  const ctx = {
    open,
    setOpen,
    show,
    setShow,
    modal,
    swipeDirection,
    showSwipeHandle,
    disablePointerDismissal,
    trigger,
    setTrigger,
    popup,
    setPopup,
    contentId,
    titleId,
    setTitleId,
    descriptionId,
    setDescriptionId,
    restoreFocus,
  };

  return (
    <DrawerContext.Provider value={ctx}>
      {props.children}
    </DrawerContext.Provider>
  );
}
