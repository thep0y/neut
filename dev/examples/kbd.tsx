import { Kbd, KbdGroup } from "~/index";
import type { Section } from "./shared";

function KbdBasic() {
  return (
    <div class="flex items-center gap-2 text-sm">
      <span>Press</span>
      <Kbd>Ctrl</Kbd>
      <span>+</span>
      <Kbd>K</Kbd>
      <span>to search</span>
    </div>
  );
}

function KbdGroupExample() {
  return (
    <div class="flex items-center gap-2 text-sm">
      <span>Open settings with</span>
      <KbdGroup>
        <Kbd>Ctrl</Kbd>
        <Kbd>,</Kbd>
      </KbdGroup>
    </div>
  );
}

export const kbdSections: Section[] = [
  {
    id: "kbd-basic",
    title: "Basic",
    description: "Display keyboard keys and shortcuts.",
    component: KbdBasic,
  },
  {
    id: "kbd-group",
    title: "Group",
    description: "Group keys that belong to one shortcut.",
    component: KbdGroupExample,
  },
];
