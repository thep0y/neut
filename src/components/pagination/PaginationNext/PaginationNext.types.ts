import type { PaginationLinkProps } from "../PaginationLink/PaginationLink.types";

export type PaginationNextProps = Omit<
  PaginationLinkProps,
  "children" | "page"
> & {
  text?: string;
};
