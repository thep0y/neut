import { Textarea } from "~/index";
import type { Section } from "./shared";

function TextareaBasic() {
  return <Textarea placeholder="Type your message here." class="max-w-sm" />;
}

function TextareaDisabled() {
  return <Textarea placeholder="Disabled" disabled class="max-w-sm" />;
}

export const textareaSections: Section[] = [
  {
    id: "textarea-basic",
    title: "Basic",
    description: "A multi-line text input.",
    component: TextareaBasic,
  },
  {
    id: "textarea-disabled",
    title: "Disabled",
    description: "Disabled textareas ignore input.",
    component: TextareaDisabled,
  },
];
