import { ComponentPage } from "../examples/shared";
import { messageScrollerSections } from "../examples/message-scroller";

export default function MessageScrollerPage() {
  return (
    <ComponentPage
      id="message-scroller"
      title="Message Scroller"
      description="A chat scroll container that anchors turns and follows streamed responses."
      sections={messageScrollerSections}
    />
  );
}
