import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/index";
import type { Section } from "./shared";

function PaginationBasic() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" page={1} isActive />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" page={2} />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" page={3} />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function PaginationWithEllipsis() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" page={1} isActive />
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#" page={8} />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export const paginationSections: Section[] = [
  {
    id: "pagination-basic",
    title: "Basic",
    description: "Page navigation with previous and next controls.",
    component: PaginationBasic,
  },
  {
    id: "pagination-ellipsis",
    title: "With Ellipsis",
    description: "Collapse skipped pages with an ellipsis.",
    component: PaginationWithEllipsis,
  },
];
