import type { PaginationLinkProps } from "../PaginationLink/PaginationLink.types";

export type PaginationNextProps = Omit<PaginationLinkProps, "children"> & {
  text?: string;
};
