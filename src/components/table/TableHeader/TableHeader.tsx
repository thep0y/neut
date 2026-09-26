import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import type { TableHeaderProps } from "./TableHeader.types";

export function TableHeader(props: TableHeaderProps) {
  const [local, rest] = splitProps(props, ["class", "classList"]);
  return (
    <thead
      {...rest}
      data-slot="table-header"
      class={clsx("[&_tr]:border-b", local.class)}
      classList={local.classList}
    />
  );
}
