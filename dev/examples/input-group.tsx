import { Search } from "lucide-solid";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "~/index";
import type { Section } from "./shared";

function InputGroupBasic() {
  return (
    <InputGroup class="max-w-sm">
      <InputGroupAddon align="inline-start">
        <Search />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search..." />
    </InputGroup>
  );
}

function InputGroupWithButton() {
  return (
    <InputGroup class="max-w-sm">
      <InputGroupInput placeholder="Enter your email" type="email" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton>Subscribe</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}

function InputGroupWithTextarea() {
  return (
    <InputGroup class="max-w-sm">
      <InputGroupTextarea placeholder="Write a message..." rows={4} />
      <InputGroupAddon align="block-end">
        <InputGroupText>Markdown supported</InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  );
}

export const inputGroupSections: Section[] = [
  {
    id: "input-group-basic",
    title: "Basic",
    description: "An input with a leading icon addon.",
    component: InputGroupBasic,
  },
  {
    id: "input-group-button",
    title: "With Button",
    description: "Place an action inside the input group.",
    component: InputGroupWithButton,
  },
  {
    id: "input-group-textarea",
    title: "With Textarea",
    description: "InputGroup also works with textareas.",
    component: InputGroupWithTextarea,
  },
];
