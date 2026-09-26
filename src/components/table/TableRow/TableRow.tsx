import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import type { TableRowProps } from "./TableRow.types";

export function TableRow(props: TableRowProps) {
  const [local, rest] = splitProps(props, ["class", "classList"]);
  return (
    <tr
      {...rest}
      data-slot="table-row"
      class={clsx(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        local.class,
      )}
      classList={local.classList}
    />
  );
}
