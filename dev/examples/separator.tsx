import { Separator } from "~/index";
import type { Section } from "./shared";

function SeparatorHorizontal() {
  return (
    <div class="w-full max-w-sm text-sm">
      <p>Neut UI</p>
      <Separator class="my-3" />
      <p class="text-muted-foreground">A SolidJS component library.</p>
    </div>
  );
}

function SeparatorVertical() {
  return (
    <div class="flex h-10 items-center gap-4 text-sm">
      <span>Docs</span>
      <Separator orientation="vertical" />
      <span>Source</span>
      <Separator orientation="vertical" />
      <span>Blog</span>
    </div>
  );
}

export const separatorSections: Section[] = [
  {
    id: "separator-horizontal",
    title: "Horizontal",
    description: "Separate vertically stacked content.",
    component: SeparatorHorizontal,
  },
  {
    id: "separator-vertical",
    title: "Vertical",
    description: "Separate inline content.",
    component: SeparatorVertical,
  },
];
