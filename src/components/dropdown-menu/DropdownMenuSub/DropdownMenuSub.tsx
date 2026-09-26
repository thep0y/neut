import type { JSX } from "solid-js";
import { ContextMenuSub } from "~/components/context-menu/ContextMenuSub";
import type { DropdownMenuSubProps } from "./DropdownMenuSub.types";

/** 子菜单状态容器：复用 context-menu 的 Sub（不渲染 DOM） */
export function DropdownMenuSub(props: DropdownMenuSubProps): JSX.Element {
  return <ContextMenuSub {...props} />;
}
