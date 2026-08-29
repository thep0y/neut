import { ComponentPage } from "../examples/shared";
import { emptySections } from "../examples/empty";

export default function EmptyPage() {
  return (
    <ComponentPage
      id="empty"
      title="Empty"
      description="Use the Empty component to display an empty state."
      sections={emptySections}
    />
  );
}
