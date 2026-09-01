import { ComponentPage } from "../examples/shared";
import { dialogSections } from "../examples/dialog";

export default function DialogPage() {
  return (
    <ComponentPage
      id="dialog"
      title="Dialog"
      description="A window overlaid on either the primary window or another dialog window, rendering the content underneath inert."
      sections={dialogSections}
    />
  );
}
