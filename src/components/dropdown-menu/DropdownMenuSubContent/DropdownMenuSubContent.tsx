import { createEffect, on, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { ContextMenuPopupSurface } from "~/components/context-menu/ContextMenuContent/ContextMenuPopupSurface";
import { createContextMenuPopupRuntime } from "~/components/context-menu/ContextMenuContent/useContextMenuContent";
import { useContextMenuSubmenu } from "~/components/context-menu/context-menu.context";
import { cancelSubmenuCloseChain } from "~/components/context-menu/context-menu.utils";
import type { DropdownMenuSubContentProps } from "./DropdownMenuSubContent.types";

export function DropdownMenuSubContent(props: DropdownMenuSubContentProps) {
  const submenu = useContextMenuSubmenu("DropdownMenuSubContent");
  const [local, rest] = splitProps(props, [
    "class",
    "style",
    "children",
    "side",
    "align",
    "sideOffset",
    "alignOffset",
    "collisionPadding",
    "onKeyDown",
    "onPointerEnter",
    "onPointerLeave",
  ]);

  const side = () => local.side ?? "right";
  const align = () => local.align ?? "start";

  const runtime = createContextMenuPopupRuntime({
    root: submenu.root,
    open: submenu.open,
    parent: submenu.parentPopup,
    isSubmenu: true,
    reference: submenu.trigger,
    submenu,
    loopFocus: submenu.loopFocus,
    orientation: submenu.orientation,
    highlightItemOnHover: submenu.highlightItemOnHover,
    side,
    align,
    sideOffset: () => local.sideOffset ?? 0,
    alignOffset: () => local.alignOffset ?? -3,
    collisionPadding: () => local.collisionPadding ?? 5,
    dir: () => undefined,
  });

  // 子菜单关闭后把焦点还给父浮层，并重新高亮触发器。
  createEffect(
    on(
      submenu.open,
      (isOpen, previous) => {
        if (!previous || isOpen) return;
        if (!submenu.root.open()) return;
        const id = submenu.itemId();
        if (!id) return;
        submenu.parentPopup.setActiveId(id);
        submenu.parentPopup.popup()?.focus({ preventScroll: true });
      },
      { defer: true },
    ),
  );

  return (
    <ContextMenuPopupSurface
      runtime={runtime}
      positionerSlot="dropdown-menu-sub-positioner"
      dataSlot="dropdown-menu-sub-content"
      contentId={runtime.popupCtx.menuId}
      open={submenu.open}
      side={side}
      dir={() => undefined}
      registerMenuElement={submenu.root.registerMenuElement}
      class={clsx("w-auto min-w-[96px] shadow-lg", local.class)}
      style={local.style}
      onKeyDown={local.onKeyDown}
      onPointerEnter={() => {
        cancelSubmenuCloseChain(submenu);
        local.onPointerEnter?.();
      }}
      onPointerLeave={() => {
        submenu.scheduleClose();
        local.onPointerLeave?.();
      }}
      rest={rest as Record<string, any>}
    >
      {local.children}
    </ContextMenuPopupSurface>
  );
}
