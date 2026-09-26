import { ComponentPage } from "../examples/shared";
import { tableSections } from "../examples/table";

export default function TablePage() {
  return (
    <ComponentPage
      id="table"
      title="Table"
      description="A responsive table component."
      sections={tableSections}
    />
  );
}
