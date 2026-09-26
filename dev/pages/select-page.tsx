import { ComponentPage } from "../examples/shared";
import { selectSections } from "../examples/select";

export default function SelectPage() {
  return (
    <ComponentPage
      id="select"
      title="Select"
      description="Displays a list of options for the user to pick from, triggered by a button."
      sections={selectSections}
    />
  );
}
