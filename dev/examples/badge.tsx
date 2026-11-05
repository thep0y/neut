import { Check } from "lucide-solid";
import { Badge } from "~/index";
import type { Section } from "./shared";

function BadgeVariants() {
  return (
    <div class="flex flex-wrap items-center gap-2">
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="link">Link</Badge>
    </div>
  );
}

function BadgeWithIcon() {
  return (
    <div class="flex flex-wrap items-center gap-2">
      <Badge>
        <Check />
        Verified
      </Badge>
      <Badge variant="secondary">
        <Check />
        Synced
      </Badge>
    </div>
  );
}

export const badgeSections: Section[] = [
  {
    id: "badge-variants",
    title: "Variants",
    description: "Badges come in primary, secondary, outline and more.",
    component: BadgeVariants,
  },
  {
    id: "badge-icon",
    title: "With Icon",
    description: "Add an icon for extra context.",
    component: BadgeWithIcon,
  },
];
