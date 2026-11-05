import { ComponentPage } from "../examples/shared";
import { aspectRatioSections } from "../examples/aspect-ratio";

export default function AspectRatioPage() {
  return (
    <ComponentPage
      id="aspect-ratio"
      title="Aspect Ratio"
      description="Displays content within a desired ratio."
      sections={aspectRatioSections}
    />
  );
}
