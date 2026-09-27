import { ComponentPage } from "../examples/shared";
import { bubbleSections } from "../examples/bubble";

export default function BubblePage() {
  return (
    <ComponentPage
      id="bubble"
      title="Bubble"
      description="Displays conversational content in a message bubble."
      sections={bubbleSections}
    />
  );
}
