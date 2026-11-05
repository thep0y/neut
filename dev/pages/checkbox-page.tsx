import { ComponentPage } from "../examples/shared";
import { checkboxSections } from "../examples/checkbox";

export default function CheckboxPage() {
  return (
    <ComponentPage
      id="checkbox"
      title="Checkbox"
      description="A control that allows the user to toggle between checked and not checked."
      sections={checkboxSections}
    />
  );
}
