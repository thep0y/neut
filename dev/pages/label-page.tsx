import { ComponentPage } from "../examples/shared";
import { labelSections } from "../examples/label";

export default function LabelPage() {
  return (
    <ComponentPage
      id="label"
      title="Label"
      description="Renders an accessible label associated with a control."
      sections={labelSections}
    />
  );
}
