import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import type { TableBodyProps } from "./TableBody.types";

export function TableBody(props: TableBodyProps) {
  const [local, rest] = splitProps(props, ["class", "classList"]);
  return (
    <tbody
      {...rest}
      data-slot="table-body"
      class={clsx("[&_tr:last-child]:border-0", local.class)}
      classList={local.classList}
    />
  );
}
