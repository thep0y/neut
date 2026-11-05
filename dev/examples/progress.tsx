import { Progress, ProgressLabel, ProgressValue } from "~/index";
import type { Section } from "./shared";

function ProgressBasic() {
  return <Progress value={60} class="w-full max-w-sm" />;
}

function ProgressWithLabel() {
  return (
    <Progress value={72} class="w-full max-w-sm">
      <div class="flex items-center justify-between text-sm">
        <ProgressLabel>Uploading</ProgressLabel>
        <ProgressValue />
      </div>
    </Progress>
  );
}

function ProgressSteps() {
  return (
    <div class="flex w-full max-w-sm flex-col gap-4">
      <Progress value={25} />
      <Progress value={50} />
      <Progress value={100} />
    </div>
  );
}

export const progressSections: Section[] = [
  {
    id: "progress-basic",
    title: "Basic",
    description: "A progress indicator with a numeric value.",
    component: ProgressBasic,
  },
  {
    id: "progress-label",
    title: "With Label",
    description: "Show a label and percentage above the bar.",
    component: ProgressWithLabel,
  },
  {
    id: "progress-steps",
    title: "Steps",
    description: "Different values render different fills.",
    component: ProgressSteps,
  },
];
