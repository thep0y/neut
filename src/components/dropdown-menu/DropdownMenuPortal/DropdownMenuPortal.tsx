import { Portal } from "solid-js/web";
import type { DropdownMenuPortalProps } from "./DropdownMenuPortal.types";

export const DropdownMenuPortal = (props: DropdownMenuPortalProps) => (
  <Portal>
    <div data-slot="dropdown-menu-portal" {...props} />
  </Portal>
);
