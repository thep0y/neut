import { ComponentPage } from "../examples/shared";
import { textareaSections } from "../examples/textarea";

export default function TextareaPage() {
  return (
    <ComponentPage
      id="textarea"
      title="Textarea"
      description="Displays a form textarea."
      sections={textareaSections}
    />
  );
}
