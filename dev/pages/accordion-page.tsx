import { ComponentPage } from "../examples/shared";
import { accordionSections } from "../examples/accordion";

export default function AccordionPage() {
  return (
    <ComponentPage
      id="accordion"
      title="Accordion"
      description="A vertically stacked set of interactive headings."
      sections={accordionSections}
    />
  );
}
