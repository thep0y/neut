import type { ParentProps } from "solid-js";
import type { BaseProps } from "~/types";
import type { ContextMenuChangeEventDetails } from "~/components/context-menu/context-menu.types";

export interface DropdownMenuCheckboxItemProps extends BaseProps, ParentProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (
    checked: boolean,
    eventDetails: ContextMenuChangeEventDetails,
  ) => void;
  disabled?: boolean;
  inset?: boolean;
  label?: string;
  closeOnClick?: boolean;
  onClick?: (event: MouseEvent) => void;
  [key: string]: any;
}
