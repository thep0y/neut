import { mergeProps, splitProps } from "solid-js";
import { Separator, type SeparatorProps } from "~/components/separator";
import { clsx } from "~/utils";
import type { DropdownMenuSeparatorProps } from "./DropdownMenuSeparator.types";

export function DropdownMenuSeparator(props: DropdownMenuSeparatorProps) {
  const merged = mergeProps({ orientation: "horizontal" } as const, props);
  const [local, rest] = splitProps(merged, ["class", "orientation"]);

  return (
    <Separator
      {...(rest as SeparatorProps)}
      data-slot="dropdown-menu-separator"
      orientation={local.orientation}
      role="separator"
      aria-orientation={local.orientation}
      class={clsx("-mx-1 my-1", local.class)}
    />
  );
}
