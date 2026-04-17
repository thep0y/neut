import type { PaginationItemProps } from "./PaginationItem.types";

export const PaginationItem = (props: PaginationItemProps) => {
  return <li data-slot="pagination-item" {...props} />;
};
