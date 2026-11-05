import { Checkbox, Input, Label } from "~/index";
import type { Section } from "./shared";

function LabelBasic() {
  return (
    <div class="flex items-center gap-2">
      <Checkbox id="label-terms" />
      <Label for="label-terms">Accept terms and conditions</Label>
    </div>
  );
}

function LabelWithInput() {
  return (
    <div class="flex w-full max-w-sm flex-col gap-2">
      <Label for="label-email">Email</Label>
      <Input id="label-email" type="email" placeholder="you@example.com" />
    </div>
  );
}

export const labelSections: Section[] = [
  {
    id: "label-basic",
    title: "Basic",
    description: "Associate a label with a checkbox.",
    component: LabelBasic,
  },
  {
    id: "label-input",
    title: "With Input",
    description: "Labels also connect to text inputs.",
    component: LabelWithInput,
  },
];
