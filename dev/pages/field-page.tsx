import { ComponentPage } from "../examples/shared";
import { fieldSections } from "../examples/field";

export default function FieldPage() {
  return (
    <ComponentPage
      id="field"
      title="Field"
      description="Combine labels, controls and help text into accessible form fields."
      sections={fieldSections}
    />
  );
}
