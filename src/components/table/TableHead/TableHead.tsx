import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import type { TableHeadProps } from "./TableHead.types";

export function TableHead(props: TableHeadProps) {
  const [local, rest] = splitProps(props, ["class", "classList"]);
  return (
    <th
      {...rest}
      data-slot="table-head"
      class={clsx(
        "h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        local.class,
      )}
      classList={local.classList}
    />
  );
}
