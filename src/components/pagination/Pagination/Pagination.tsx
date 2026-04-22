import { splitProps } from "solid-js";
import type { PaginationProps } from "./Pagination.types";
import { clsx } from "~/utils";

export const Pagination = (props: PaginationProps) => {
  const [local, others] = splitProps(props, ["class", "classList"]);

  return (
    <nav
      aria-label="pagination"
      data-slot="pagination"
      class={clsx("mx-auto flex w-full justify-center", local.class)}
      {...others}
    />
  );
};
