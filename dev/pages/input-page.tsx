import { ComponentPage } from "../examples/shared";
import { inputSections } from "../examples/input";

export default function InputPage() {
  return (
    <ComponentPage
      id="input"
      title="Input"
      description="A text input component."
      sections={inputSections}
    />
  );
}
