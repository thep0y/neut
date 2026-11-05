import { ComponentPage } from "../examples/shared";
import { collapsibleSections } from "../examples/collapsible";

export default function CollapsiblePage() {
  return (
    <ComponentPage
      id="collapsible"
      title="Collapsible"
      description="An interactive component which expands and collapses a panel."
      sections={collapsibleSections}
    />
  );
}
