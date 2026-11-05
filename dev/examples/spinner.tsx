import { Spinner } from "~/index";
import type { Section } from "./shared";

function SpinnerBasic() {
  return <Spinner class="size-6" />;
}

function SpinnerWithText() {
  return (
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <Spinner class="size-4" />
      Loading…
    </div>
  );
}

function SpinnerSizes() {
  return (
    <div class="flex items-center gap-4">
      <Spinner class="size-3" />
      <Spinner class="size-5" />
      <Spinner class="size-8" />
    </div>
  );
}

export const spinnerSections: Section[] = [
  {
    id: "spinner-basic",
    title: "Basic",
    description: "A rotating loading indicator.",
    component: SpinnerBasic,
  },
  {
    id: "spinner-text",
    title: "With Text",
    description: "Pair a spinner with a loading message.",
    component: SpinnerWithText,
  },
  {
    id: "spinner-sizes",
    title: "Sizes",
    description: "Control the size with utility classes.",
    component: SpinnerSizes,
  },
];
