import { Input } from "~/index";
import type { Section } from "./shared";

function InputBasic() {
  return <Input placeholder="Email" type="email" class="max-w-sm" />;
}

function InputTypes() {
  return (
    <div class="flex w-full max-w-sm flex-col gap-3">
      <Input placeholder="Username" />
      <Input placeholder="Password" type="password" />
      <Input placeholder="Search" type="search" />
    </div>
  );
}

function InputDisabled() {
  return <Input placeholder="Disabled" disabled class="max-w-sm" />;
}

export const inputSections: Section[] = [
  {
    id: "input-basic",
    title: "Basic",
    description: "A text input with a placeholder.",
    component: InputBasic,
  },
  {
    id: "input-types",
    title: "Types",
    description: "Text, password and search inputs.",
    component: InputTypes,
  },
  {
    id: "input-disabled",
    title: "Disabled",
    description: "Disabled inputs ignore input.",
    component: InputDisabled,
  },
];
