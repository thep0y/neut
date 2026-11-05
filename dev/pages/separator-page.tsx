import { ComponentPage } from "../examples/shared";
import { separatorSections } from "../examples/separator";

export default function SeparatorPage() {
  return (
    <ComponentPage
      id="separator"
      title="Separator"
      description="Visually or semantically separates content."
      sections={separatorSections}
    />
  );
}
