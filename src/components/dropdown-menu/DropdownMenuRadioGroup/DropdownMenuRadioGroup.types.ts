import type { ParentProps } from "solid-js";
import type { BaseProps } from "~/types";
import type { ContextMenuChangeEventDetails } from "~/components/context-menu/context-menu.types";

export interface DropdownMenuRadioGroupProps extends BaseProps, ParentProps {
  value?: any;
  defaultValue?: any;
  onValueChange?: (
    value: any,
    eventDetails: ContextMenuChangeEventDetails,
  ) => void;
  disabled?: boolean;
  [key: string]: any;
}
