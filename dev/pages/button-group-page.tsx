import { ComponentPage } from "../examples/shared";
import { buttonGroupSections } from "../examples/button-group";

export default function ButtonGroupPage() {
  return (
    <ComponentPage
      id="button-group"
      title="Button Group"
      description="Groups related buttons into a single control."
      sections={buttonGroupSections}
    />
  );
}
