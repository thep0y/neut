import { splitProps } from "solid-js";
import type { PaginationContentProps } from "./PaginationContent.types";
import { clsx } from "~/utils";

export const PaginationContent = (props: PaginationContentProps) => {
  const [local, others] = splitProps(props, ["class", "classList"]);

  return (
    <ul
      data-slot="pagination-content"
      class={clsx("flex items-center gap-0.5", local.class)}
      {...others}
    />
  );
};
