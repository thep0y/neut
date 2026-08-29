import { ComponentPage } from "../examples/shared";
import { popoverSections } from "../examples/popover";

export default function PopoverPage() {
  return (
    <ComponentPage
      id="popover"
      title="Popover"
      description="Displays rich content in a portal, triggered by a button."
      sections={popoverSections}
    />
  );
}
