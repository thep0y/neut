import { ComponentPage } from "../examples/shared";
import { sheetSections } from "../examples/sheet";

export default function SheetPage() {
  return (
    <ComponentPage
      id="sheet"
      title="Sheet"
      description="Extends the Dialog component to display content that complements the main content of the screen."
      sections={sheetSections}
    />
  );
}
