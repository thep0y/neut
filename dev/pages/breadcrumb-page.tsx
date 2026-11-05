import { ComponentPage } from "../examples/shared";
import { breadcrumbSections } from "../examples/breadcrumb";

export default function BreadcrumbPage() {
  return (
    <ComponentPage
      id="breadcrumb"
      title="Breadcrumb"
      description="Displays the path to the current resource."
      sections={breadcrumbSections}
    />
  );
}
