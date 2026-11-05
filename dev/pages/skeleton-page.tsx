import { ComponentPage } from "../examples/shared";
import { skeletonSections } from "../examples/skeleton";

export default function SkeletonPage() {
  return (
    <ComponentPage
      id="skeleton"
      title="Skeleton"
      description="Use to show a placeholder while content is loading."
      sections={skeletonSections}
    />
  );
}
