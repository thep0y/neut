import { ComponentPage } from "../examples/shared";
import { questionnaireSections } from "../examples/questionnaire";

export default function QuestionnairePage() {
  return (
    <ComponentPage
      id="questionnaire"
      title="Questionnaire"
      description="A multi-step questionnaire with single-choice, multiple-choice, freeform, and skippable questions."
      sections={questionnaireSections}
    />
  );
}
