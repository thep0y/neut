import { ComponentPage } from "../examples/shared";
import { resizableSections } from "../examples/resizable";

export default function ResizablePage() {
  return (
    <ComponentPage
      id="resizable"
      title="Resizable"
      description="Accessible resizable panel groups and layouts with keyboard support."
      sections={resizableSections}
    />
  );
}
