import { ComponentPage } from "../examples/shared";
import { paginationSections } from "../examples/pagination";

export default function PaginationPage() {
  return (
    <ComponentPage
      id="pagination"
      title="Pagination"
      description="Pagination with page navigation and ellipsis."
      sections={paginationSections}
    />
  );
}
