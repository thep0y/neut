import type { ParentProps } from "solid-js";
import type { BaseProps } from "~/types";

export type DropdownMenuItemVariant = "default" | "destructive";

export interface DropdownMenuItemProps extends BaseProps, ParentProps {
  inset?: boolean;
  variant?: DropdownMenuItemVariant;
  disabled?: boolean;
  /** 键盘字符导航匹配用的文本，默认取子节点文本 */
  label?: string;
  /** 点击后是否关闭菜单，默认 true */
  closeOnClick?: boolean;
  onClick?: (event: MouseEvent) => void;
  [key: string]: any;
}
