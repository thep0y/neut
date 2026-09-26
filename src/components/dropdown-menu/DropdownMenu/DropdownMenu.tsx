import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
  type JSX,
} from "solid-js";
import { useScrollLock } from "~/hooks";
import { ContextMenuContext } from "~/components/context-menu/ContextMenu/ContextMenu.context";
import type {
  ContextMenuChangeEventReason,
  ContextMenuContextValue,
} from "~/components/context-menu/context-menu.types";
import { createChangeEventDetails } from "~/components/context-menu/context-menu.utils";
import { DropdownMenuContext } from "./DropdownMenu.context";
import type { DropdownMenuProps } from "./DropdownMenu.types";

/** 菜单自身（根菜单/子菜单）的 popup 容器，允许在锁滚动期间继续在菜单内部滚动 */
const MENU_POPUP_SELECTOR =
  '[data-slot="dropdown-menu-content"],[data-slot="dropdown-menu-sub-content"]';

/**
 * DropdownMenu 根组件：不渲染 DOM，负责状态、触发锚点与外部交互，
 * 并复用 context-menu 的菜单运行时（定位/注册表/键盘/子菜单）。
 *
 * 与 ContextMenu 的区别：锚点是触发器元素（不是鼠标坐标），通过点击/键盘打开。
 */
export function DropdownMenu(props: DropdownMenuProps): JSX.Element {
  const [internalOpen, setInternalOpen] = createSignal(
    props.defaultOpen ?? false,
  );
  const open = createMemo(() =>
    props.open !== undefined ? props.open : internalOpen(),
  );
  const disabled = createMemo(() => !!props.disabled);
  const loopFocus = createMemo(() => props.loopFocus ?? true);
  const orientation = createMemo(() => props.orientation ?? "vertical");
  const highlightItemOnHover = createMemo(
    () => props.highlightItemOnHover ?? true,
  );
  const modal = createMemo(() => props.modal ?? true);

  useScrollLock(() => open() && modal(), {
    allowedSelector: MENU_POPUP_SELECTOR,
  });

  const [finalFocus, setFinalFocus] = createSignal(true);
  const [trigger, setTrigger] = createSignal<HTMLElement>();
  const contentId = `dropdown-menu-content-${createUniqueId()}`;

  const menuElements = new Set<HTMLElement>();

  const restoreFocus = () => {
    const el = trigger();
    if (el && typeof el.focus === "function") {
      el.focus({ preventScroll: true });
    }
  };

  const commit = (
    next: boolean,
    reason: ContextMenuChangeEventReason,
    event?: Event,
  ) => {
    if (props.open === undefined) setInternalOpen(next);
    props.onOpenChange?.(
      next,
      createChangeEventDetails(reason, event, trigger()),
    );
  };

  const closeAll = (reason: ContextMenuChangeEventReason, event?: Event) => {
    if (!open()) return;
    commit(false, reason, event);
    if (reason !== "outside-press" && finalFocus()) restoreFocus();
  };

  const setOpen = (next: boolean, event?: Event) => {
    if (disabled() && next) return;
    if (next === open()) return;
    commit(next, next ? "trigger-press" : "imperative-action", event);
  };

  const toggle = (event?: Event) => {
    if (disabled()) return;
    if (open()) closeAll("trigger-press", event);
    else commit(true, "trigger-press", event);
  };

  const isInsideMenu = (node: Node | null): boolean => {
    if (!node || !(node instanceof Element)) return false;
    for (const el of menuElements) {
      if (el.contains(node)) return true;
    }
    return false;
  };

  const isInsideTrigger = (node: Node | null): boolean => {
    if (!node || !(node instanceof Element)) return false;
    return !!trigger()?.contains(node);
  };

  const registerMenuElement = (el: HTMLElement) => {
    menuElements.add(el);
    return () => {
      menuElements.delete(el);
    };
  };

  // 打开期间：点击菜单与触发器之外关闭 + Escape 兜底关闭。
  createEffect(() => {
    if (!open()) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (isInsideMenu(target) || isInsideTrigger(target)) return;
      closeAll("outside-press", e);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (e.key === "Escape") closeAll("escape-key", e);
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    onCleanup(() => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    });
  });

  // 复用 context-menu 运行时的 root 契约；dropdown 不使用坐标锚点。
  const rootCtx: ContextMenuContextValue = {
    open,
    disabled,
    loopFocus,
    orientation,
    highlightItemOnHover,
    trigger,
    setTrigger,
    anchor: () => undefined,
    contentId,
    finalFocus,
    setFinalFocus,
    openAt: () => {},
    closeAll,
    registerMenuElement,
    isInsideMenu,
  };

  return (
    <ContextMenuContext.Provider value={rootCtx}>
      <DropdownMenuContext.Provider
        value={{
          open,
          disabled,
          setOpen,
          toggle,
          trigger,
          setTrigger,
          contentId,
        }}
      >
        {props.children}
      </DropdownMenuContext.Provider>
    </ContextMenuContext.Provider>
  );
}
