import { ComponentPage } from "../examples/shared";
import { kbdSections } from "../examples/kbd";

export default function KbdPage() {
  return (
    <ComponentPage
      id="kbd"
      title="Kbd"
      description="Displays keyboard keys and shortcuts."
      sections={kbdSections}
    />
  );
}
