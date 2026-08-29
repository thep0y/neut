import { ComponentPage } from "../examples/shared";
import { calendarSections } from "../examples/calendar";

export default function CalendarPage() {
  return (
    <ComponentPage
      id="calendar"
      title="Calendar"
      description="A calendar component that allows users to select a date or a range of dates."
      sections={calendarSections}
    />
  );
}
