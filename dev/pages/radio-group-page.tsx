import { ComponentPage } from "../examples/shared";
import { radioGroupSections } from "../examples/radio-group";

export default function RadioGroupPage() {
  return (
    <ComponentPage
      id="radio-group"
      title="Radio Group"
      description="A set of checkable buttons—known as radio buttons—where no more than one of the buttons can be checked at a time."
      sections={radioGroupSections}
    />
  );
}
