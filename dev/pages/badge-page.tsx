import { ComponentPage } from "../examples/shared";
import { badgeSections } from "../examples/badge";

export default function BadgePage() {
  return (
    <ComponentPage
      id="badge"
      title="Badge"
      description="Displays a badge or a component that looks like a badge."
      sections={badgeSections}
    />
  );
}
