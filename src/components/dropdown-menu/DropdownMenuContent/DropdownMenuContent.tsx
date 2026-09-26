import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import { useContextMenuContext } from "~/components/context-menu/ContextMenu/ContextMenu.context";
import { ContextMenuPopupSurface } from "~/components/context-menu/ContextMenuContent/ContextMenuPopupSurface";
import { createContextMenuPopupRuntime } from "~/components/context-menu/ContextMenuContent/useContextMenuContent";
import type { DropdownMenuContentProps } from "./DropdownMenuContent.types";

/**
 * 菜单内容：复用 context-menu 的浮层运行时与展示骨架，
 * 仅把定位锚点换成触发器、data-slot 换成 dropdown-menu-content。
 */
export function DropdownMenuContent(props: DropdownMenuContentProps) {
  const root = useContextMenuContext("DropdownMenuContent");
  const [local, rest] = splitProps(props, [
    "side",
    "align",
    "sideOffset",
    "alignOffset",
    "collisionPadding",
    "class",
    "style",
    "onKeyDown",
    "children",
  ]);

  const side = () => local.side ?? "bottom";
  const align = () => local.align ?? "start";

  const runtime = createContextMenuPopupRuntime({
    root,
    open: root.open,
    isSubmenu: false,
    reference: root.trigger,
    side,
    align,
    sideOffset: () => local.sideOffset ?? 4,
    alignOffset: () => local.alignOffset ?? 0,
    collisionPadding: () => local.collisionPadding ?? 8,
    dir: () => undefined,
  });

  return (
    <ContextMenuPopupSurface
      runtime={runtime}
      positionerSlot="dropdown-menu-positioner"
      dataSlot="dropdown-menu-content"
      contentId={root.contentId}
      open={root.open}
      side={side}
      dir={() => undefined}
      registerMenuElement={root.registerMenuElement}
      class={clsx("min-w-32", local.class)}
      style={local.style}
      onKeyDown={local.onKeyDown}
      rest={rest as Record<string, any>}
    >
      {local.children}
    </ContextMenuPopupSurface>
  );
}
