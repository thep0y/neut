import { ComponentPage } from "../examples/shared";
import { inputGroupSections } from "../examples/input-group";

export default function InputGroupPage() {
  return (
    <ComponentPage
      id="input-group"
      title="Input Group"
      description="A flexible input with addons, buttons and text."
      sections={inputGroupSections}
    />
  );
}
