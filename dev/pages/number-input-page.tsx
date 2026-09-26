import { ComponentPage } from "../examples/shared";
import { numberInputSections } from "../examples/number-input";

export default function NumberInputPage() {
  return (
    <ComponentPage
      id="number-input"
      title="Number Input"
      description="A number input with custom stepper buttons instead of the native spinners."
      sections={numberInputSections}
    />
  );
}
