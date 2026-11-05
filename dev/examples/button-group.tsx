import { Bold, Italic, Underline } from "lucide-solid";
import {
  Button,
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
} from "~/index";
import type { Section } from "./shared";

function ButtonGroupBasic() {
  return (
    <ButtonGroup>
      <Button variant="outline">Copy</Button>
      <Button variant="outline">Cut</Button>
      <Button variant="outline">Paste</Button>
    </ButtonGroup>
  );
}

function ButtonGroupVertical() {
  return (
    <ButtonGroup orientation="vertical">
      <Button variant="outline">Top</Button>
      <Button variant="outline">Middle</Button>
      <Button variant="outline">Bottom</Button>
    </ButtonGroup>
  );
}

function ButtonGroupWithText() {
  return (
    <ButtonGroup>
      <ButtonGroupText>Format</ButtonGroupText>
      <ButtonGroupSeparator />
      <Button variant="outline" size="sm" aria-label="Bold">
        <Bold />
      </Button>
      <Button variant="outline" size="sm" aria-label="Italic">
        <Italic />
      </Button>
      <Button variant="outline" size="sm" aria-label="Underline">
        <Underline />
      </Button>
    </ButtonGroup>
  );
}

export const buttonGroupSections: Section[] = [
  {
    id: "button-group-basic",
    title: "Basic",
    description: "Group related buttons into a single control.",
    component: ButtonGroupBasic,
  },
  {
    id: "button-group-vertical",
    title: "Vertical",
    description: "Stack buttons vertically.",
    component: ButtonGroupVertical,
  },
  {
    id: "button-group-text",
    title: "With Text",
    description: "Combine text and buttons in one group.",
    component: ButtonGroupWithText,
  },
];
