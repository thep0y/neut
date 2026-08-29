import { ComponentPage } from "../examples/shared";
import { toggleGroupSections } from "../examples/toggle-group";

export default function ToggleGroupPage() {
  return (
    <ComponentPage
      id="toggle-group"
      title="Toggle Group"
      description="A set of two-state buttons that can be toggled on or off."
      sections={toggleGroupSections}
    />
  );
}
