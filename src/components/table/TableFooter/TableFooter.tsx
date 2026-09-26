import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import type { TableFooterProps } from "./TableFooter.types";

export function TableFooter(props: TableFooterProps) {
  const [local, rest] = splitProps(props, ["class", "classList"]);
  return (
    <tfoot
      {...rest}
      data-slot="table-footer"
      class={clsx(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        local.class,
      )}
      classList={local.classList}
    />
  );
}
