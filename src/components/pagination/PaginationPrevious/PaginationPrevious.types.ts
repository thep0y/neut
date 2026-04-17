import type { PaginationLinkProps } from "../PaginationLink/PaginationLink.types";

export type PaginationPreviousProps = Omit<PaginationLinkProps, "children"> & {
  text?: string;
};
