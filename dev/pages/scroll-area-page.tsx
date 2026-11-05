import { ComponentPage } from "../examples/shared";
import { scrollAreaSections } from "../examples/scroll-area";

export default function ScrollAreaPage() {
  return (
    <ComponentPage
      id="scroll-area"
      title="Scroll Area"
      description="A scrollable container with custom scrollbars."
      sections={scrollAreaSections}
    />
  );
}
