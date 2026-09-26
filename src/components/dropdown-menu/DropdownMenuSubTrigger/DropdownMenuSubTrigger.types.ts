import type { ParentProps } from "solid-js";
import type { BaseProps } from "~/types";

export interface DropdownMenuSubTriggerProps extends BaseProps, ParentProps {
  inset?: boolean;
  disabled?: boolean;
  label?: string;
  openOnHover?: boolean;
  delay?: number;
  closeDelay?: number;
  onClick?: (event: MouseEvent) => void;
  [key: string]: any;
}
