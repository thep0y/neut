import { ComponentPage } from "../examples/shared";
import { timePickerSections } from "../examples/time-picker";

export default function TimePickerPage() {
  return (
    <ComponentPage
      id="time-picker"
      title="Time Picker"
      description="A time picker built from a popover and scrollable hour, minute and second columns."
      sections={timePickerSections}
    />
  );
}
