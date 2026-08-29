import {
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "~/index";
import type { Section } from "./shared";

function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger variant="outline">Open popover</PopoverTrigger>
      <PopoverContent class="w-80">
        <div class="grid gap-4">
          <div class="space-y-2">
            <h4 class="leading-none font-medium">Dimensions</h4>
            <p class="text-sm text-muted-foreground">
              Set the dimensions for the layer.
            </p>
          </div>
          <div class="grid gap-2">
            <div class="grid grid-cols-3 items-center gap-4">
              <Label for="width">Width</Label>
              <Input id="width" defaultValue="100%" class="col-span-2 h-8" />
            </div>
            <div class="grid grid-cols-3 items-center gap-4">
              <Label for="maxWidth">Max. width</Label>
              <Input
                id="maxWidth"
                defaultValue="300px"
                class="col-span-2 h-8"
              />
            </div>
            <div class="grid grid-cols-3 items-center gap-4">
              <Label for="height">Height</Label>
              <Input id="height" defaultValue="25px" class="col-span-2 h-8" />
            </div>
            <div class="grid grid-cols-3 items-center gap-4">
              <Label for="maxHeight">Max. height</Label>
              <Input
                id="maxHeight"
                defaultValue="none"
                class="col-span-2 h-8"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PopoverBasic() {
  return (
    <Popover>
      <PopoverTrigger variant="outline" class="w-fit">
        Open Popover
      </PopoverTrigger>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>Description text here.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  );
}

function PopoverAlignments() {
  return (
    <div class="flex gap-6">
      <Popover>
        <PopoverTrigger variant="outline" size="sm">
          Start
        </PopoverTrigger>
        <PopoverContent align="start" class="w-40">
          Aligned to start
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger variant="outline" size="sm">
          Center
        </PopoverTrigger>
        <PopoverContent align="center" class="w-40">
          Aligned to center
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger variant="outline" size="sm">
          End
        </PopoverTrigger>
        <PopoverContent align="end" class="w-40">
          Aligned to end
        </PopoverContent>
      </Popover>
    </div>
  );
}

function PopoverForm() {
  return (
    <Popover>
      <PopoverTrigger variant="outline">Open Popover</PopoverTrigger>
      <PopoverContent class="w-64" align="start">
        <PopoverHeader>
          <PopoverTitle>Dimensions</PopoverTitle>
          <PopoverDescription>
            Set the dimensions for the layer.
          </PopoverDescription>
        </PopoverHeader>
        <FieldGroup class="gap-4">
          <Field orientation="horizontal">
            <FieldLabel for="width" class="w-1/2">
              Width
            </FieldLabel>
            <Input id="width" defaultValue="100%" />
          </Field>
          <Field orientation="horizontal">
            <FieldLabel for="height" class="w-1/2">
              Height
            </FieldLabel>
            <Input id="height" defaultValue="25px" />
          </Field>
        </FieldGroup>
      </PopoverContent>
    </Popover>
  );
}

export const popoverSections: Section[] = [
  {
    id: "popover-usage",
    title: "Usage",
    description: "Displays rich content in a portal, triggered by a button.",
    component: PopoverDemo,
  },
  {
    id: "popover-basic",
    title: "Basic",
    description: "A simple popover with a header, title, and description.",
    component: PopoverBasic,
  },
  {
    id: "popover-alignments",
    title: "Align",
    description:
      "Use the align prop on PopoverContent to control horizontal alignment.",
    component: PopoverAlignments,
  },
  {
    id: "popover-form",
    title: "With Form",
    description: "A popover with form fields inside.",
    component: PopoverForm,
  },
];
