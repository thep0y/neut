import { ComponentPage } from "../examples/shared";
import { toggleSections } from "../examples/toggle";

export default function TogglePage() {
  return (
    <ComponentPage
      id="toggle"
      title="Toggle"
      description="A two-state button that can be either on or off."
      sections={toggleSections}
    />
  );
}
