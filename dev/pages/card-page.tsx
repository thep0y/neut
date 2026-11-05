import { ComponentPage } from "../examples/shared";
import { cardSections } from "../examples/card";

export default function CardPage() {
  return (
    <ComponentPage
      id="card"
      title="Card"
      description="Displays a card with header, content and footer."
      sections={cardSections}
    />
  );
}
