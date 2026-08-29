import { ComponentPage } from "../examples/shared";
import { datePickerSections } from "../examples/date-picker";

export default function DatePickerPage() {
  return (
    <ComponentPage
      id="date-picker"
      title="Date Picker"
      description="A date picker component with range and presets."
      sections={datePickerSections}
    />
  );
}
