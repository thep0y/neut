import { ComponentPage } from "../examples/shared";
import { comboboxSections } from "../examples/combobox";

export default function ComboboxPage() {
  return (
    <ComponentPage
      id="combobox"
      title="Combobox"
      description="Autocomplete input with a list of suggestions."
      sections={comboboxSections}
    />
  );
}
