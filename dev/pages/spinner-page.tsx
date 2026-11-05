import { ComponentPage } from "../examples/shared";
import { spinnerSections } from "../examples/spinner";

export default function SpinnerPage() {
  return (
    <ComponentPage
      id="spinner"
      title="Spinner"
      description="An indicator that can be used to show a loading state."
      sections={spinnerSections}
    />
  );
}
