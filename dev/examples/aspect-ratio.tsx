import { AspectRatio } from "~/index";
import type { Section } from "./shared";

function AspectRatioBasic() {
  return (
    <div class="w-full max-w-md">
      <AspectRatio ratio={16 / 9}>
        <div class="flex size-full items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
          16 / 9
        </div>
      </AspectRatio>
    </div>
  );
}

function AspectRatioSquare() {
  return (
    <div class="w-48">
      <AspectRatio ratio={1}>
        <div class="flex size-full items-center justify-center rounded-lg bg-primary text-primary-foreground">
          1 / 1
        </div>
      </AspectRatio>
    </div>
  );
}

export const aspectRatioSections: Section[] = [
  {
    id: "aspect-ratio-basic",
    title: "Basic",
    description: "Constrain content to a 16:9 ratio.",
    component: AspectRatioBasic,
  },
  {
    id: "aspect-ratio-square",
    title: "Square",
    description: "Use ratio={1} for a square.",
    component: AspectRatioSquare,
  },
];
