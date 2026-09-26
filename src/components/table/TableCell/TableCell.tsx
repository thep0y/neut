import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import type { TableCellProps } from "./TableCell.types";

export function TableCell(props: TableCellProps) {
  const [local, rest] = splitProps(props, ["class", "classList"]);
  return (
    <td
      {...rest}
      data-slot="table-cell"
      class={clsx(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        local.class,
      )}
      classList={local.classList}
    />
  );
}
