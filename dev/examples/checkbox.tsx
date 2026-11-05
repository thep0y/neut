import { createSignal } from "solid-js";
import { Checkbox, Label } from "~/index";
import type { Section } from "./shared";

function CheckboxBasic() {
  return (
    <div class="flex items-center gap-2">
      <Checkbox id="checkbox-terms" defaultChecked />
      <Label for="checkbox-terms">Accept terms and conditions</Label>
    </div>
  );
}

function CheckboxControlled() {
  const [checked, setChecked] = createSignal(false);

  return (
    <div class="flex items-center gap-2">
      <Checkbox
        id="checkbox-controlled"
        checked={checked()}
        onChange={setChecked}
      />
      <Label for="checkbox-controlled">
        Notifications: {checked() ? "on" : "off"}
      </Label>
    </div>
  );
}

function CheckboxDisabled() {
  return (
    <div class="flex items-center gap-2">
      <Checkbox id="checkbox-disabled" disabled />
      <Label for="checkbox-disabled">Disabled checkbox</Label>
    </div>
  );
}

export const checkboxSections: Section[] = [
  {
    id: "checkbox-basic",
    title: "Basic",
    description: "A checkbox with an associated label.",
    component: CheckboxBasic,
  },
  {
    id: "checkbox-controlled",
    title: "Controlled",
    description: "Drive the checked state with a signal.",
    component: CheckboxControlled,
  },
  {
    id: "checkbox-disabled",
    title: "Disabled",
    description: "Disabled checkboxes ignore input.",
    component: CheckboxDisabled,
  },
];
