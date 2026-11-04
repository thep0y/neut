import { ComponentPage } from "../examples/shared";
import { buttonSections } from "../examples/button";

export default function ButtonPage() {
  return (
    <ComponentPage
      id="button"
      title="Button"
      description="Displays a button or a component that looks like a button."
      sections={buttonSections}
    />
  );
}
