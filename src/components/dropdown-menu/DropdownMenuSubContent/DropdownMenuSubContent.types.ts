import type { JSX, ParentProps } from "solid-js";
import type { BaseProps } from "~/types";
import type {
  ContextMenuAlign,
  ContextMenuSide,
} from "~/components/context-menu/context-menu.types";

export interface DropdownMenuSubContentProps extends BaseProps, ParentProps {
  side?: ContextMenuSide;
  align?: ContextMenuAlign;
  sideOffset?: number;
  alignOffset?: number;
  collisionPadding?: number;
  onKeyDown?: (e: KeyboardEvent) => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  style?: JSX.CSSProperties;
  [key: string]: any;
}
