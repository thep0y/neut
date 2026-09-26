import type { ParentProps } from "solid-js";
import type { BaseProps } from "~/types";

export interface DropdownMenuRadioItemProps extends BaseProps, ParentProps {
  value: any;
  disabled?: boolean;
  inset?: boolean;
  label?: string;
  closeOnClick?: boolean;
  onClick?: (event: MouseEvent) => void;
  [key: string]: any;
}
