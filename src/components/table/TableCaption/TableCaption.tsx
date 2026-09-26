import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import type { TableCaptionProps } from "./TableCaption.types";

export function TableCaption(props: TableCaptionProps) {
  const [local, rest] = splitProps(props, ["class", "classList"]);
  return (
    <caption
      {...rest}
      data-slot="table-caption"
      class={clsx("mt-4 text-sm text-muted-foreground", local.class)}
      classList={local.classList}
    />
  );
}
