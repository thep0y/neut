import { ScrollArea, Separator } from "~/index";
import type { Section } from "./shared";

const TAGS = Array.from({ length: 30 }, (_, index) => `Item ${index + 1}`);

function ScrollAreaVertical() {
  return (
    <ScrollArea
      orientation="vertical"
      class="h-56 w-full max-w-sm rounded-lg border"
      aria-label="Items"
    >
      <div class="p-4">
        {TAGS.map((tag) => (
          <div class="py-2 text-sm">{tag}</div>
        ))}
      </div>
    </ScrollArea>
  );
}

function ScrollAreaHorizontal() {
  return (
    <ScrollArea
      orientation="horizontal"
      class="w-full max-w-sm rounded-lg border"
      aria-label="Columns"
    >
      <div class="flex gap-2 p-4">
        {Array.from({ length: 12 }, (_, index) => (
          <div class="flex h-24 w-32 shrink-0 items-center justify-center rounded-lg bg-muted text-sm">
            Card {index + 1}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

function ScrollAreaWithSeparator() {
  return (
    <ScrollArea
      orientation="vertical"
      class="h-56 w-full max-w-sm rounded-lg border"
    >
      <div class="space-y-3 p-4 text-sm">
        <p>Account settings</p>
        <Separator />
        <p>Privacy</p>
        <Separator />
        <p>Notifications</p>
        <Separator />
        <p>Billing</p>
        <Separator />
        <p>Integrations</p>
        <Separator />
        <p>Advanced</p>
      </div>
    </ScrollArea>
  );
}

export const scrollAreaSections: Section[] = [
  {
    id: "scroll-area-vertical",
    title: "Vertical",
    description: "A scrollable list with a custom scrollbar.",
    component: ScrollAreaVertical,
  },
  {
    id: "scroll-area-horizontal",
    title: "Horizontal",
    description: "Scroll horizontally through cards.",
    component: ScrollAreaHorizontal,
  },
  {
    id: "scroll-area-separator",
    title: "With Separator",
    description: "Combine ScrollArea with separators.",
    component: ScrollAreaWithSeparator,
  },
];
