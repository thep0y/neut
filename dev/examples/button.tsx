import { ArrowRight, Plus } from "lucide-solid";
import { Button } from "~/index";
import type { Section } from "./shared";

function ButtonVariants() {
  return (
    <div class="flex flex-wrap items-center gap-2">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  );
}

function ButtonSizes() {
  return (
    <div class="flex flex-wrap items-center gap-2">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  );
}

function ButtonIcons() {
  return (
    <div class="flex flex-wrap items-center gap-2">
      <Button icon={<Plus />}>New item</Button>
      <Button variant="outline" icon={<ArrowRight />} iconPosition="right">
        Continue
      </Button>
      <Button variant="outline" icon={<Plus />} aria-label="Add item" />
    </div>
  );
}

function ButtonDisabled() {
  return (
    <div class="flex flex-wrap items-center gap-2">
      <Button disabled>Disabled</Button>
      <Button variant="outline" disabled>
        Disabled
      </Button>
    </div>
  );
}

function ButtonLink() {
  return (
    <Button component="a" href="#button-link" variant="link">
      Open link
    </Button>
  );
}

export const buttonSections: Section[] = [
  {
    id: "button-variants",
    title: "Variants",
    description: "Primary, secondary, outline, ghost, destructive and link.",
    component: ButtonVariants,
  },
  {
    id: "button-sizes",
    title: "Sizes",
    description: "Extra small, small, medium and large.",
    component: ButtonSizes,
  },
  {
    id: "button-icons",
    title: "With Icon",
    description: "Icon on either side, or an icon-only button.",
    component: ButtonIcons,
  },
  {
    id: "button-disabled",
    title: "Disabled",
    description: "Disabled buttons ignore pointer and keyboard input.",
    component: ButtonDisabled,
  },
  {
    id: "button-link",
    title: "As Link",
    description: "Render an anchor with the same button styles.",
    component: ButtonLink,
  },
];
