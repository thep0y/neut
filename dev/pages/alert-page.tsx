import { ComponentPage } from "../examples/shared";
import { alertSections } from "../examples/alert";

export default function AlertPage() {
  return (
    <ComponentPage
      id="alert"
      title="Alert"
      description="Displays a callout for user attention."
      sections={alertSections}
    />
  );
}
