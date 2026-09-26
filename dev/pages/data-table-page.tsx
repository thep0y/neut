import { ComponentPage } from "../examples/shared";
import { dataTableSections } from "../examples/data-table";

export default function DataTablePage() {
  return (
    <ComponentPage
      id="data-table"
      title="Data Table"
      description="Powerful table and datagrids built with the Solid table engine."
      sections={dataTableSections}
    />
  );
}
