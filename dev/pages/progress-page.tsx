import { ComponentPage } from "../examples/shared";
import { progressSections } from "../examples/progress";

export default function ProgressPage() {
  return (
    <ComponentPage
      id="progress"
      title="Progress"
      description="Displays an indicator showing the completion progress of a task."
      sections={progressSections}
    />
  );
}
