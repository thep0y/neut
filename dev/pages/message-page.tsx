import { ComponentPage } from "../examples/shared";
import { messageSections } from "../examples/message";

export default function MessagePage() {
  return (
    <ComponentPage
      id="message"
      title="Message"
      description="Displays a message in a conversation, with optional avatar, header, footer, and alignment."
      sections={messageSections}
    />
  );
}
