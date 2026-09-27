import { ComponentPage } from "../examples/shared";
import { hoverCardSections } from "../examples/hover-card";

export default function HoverCardPage() {
  return (
    <ComponentPage
      id="hover-card"
      title="Hover Card"
      description="For sighted users to preview content available behind a link."
      sections={hoverCardSections}
    />
  );
}
