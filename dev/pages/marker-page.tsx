import { ComponentPage } from "../examples/shared";
import { markerSections } from "../examples/marker";

export default function MarkerPage() {
  return (
    <ComponentPage
      id="marker"
      title="Marker"
      description="Displays an inline status, system note, bordered row, or labeled separator."
      sections={markerSections}
    />
  );
}
