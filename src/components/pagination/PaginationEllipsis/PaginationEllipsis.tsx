import { splitProps } from "solid-js";
import type { PaginationEllipsisProps } from "./PaginationEllipsis.types";
import { clsx } from "~/lib/utils";
import { Ellipsis } from "lucide-solid";

export const PaginationEllipsis = (props: PaginationEllipsisProps) => {
  const [local, others] = splitProps(props, ["class", "classList"]);

  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      class={clsx(
        "flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        local.class,
      )}
      {...others}
    >
      <Ellipsis />
      <span class="sr-only">More pages</span>
    </span>
  );
};
