import { ComponentPage } from "../examples/shared";
import { itemSections } from "../examples/item";

export default function ItemPage() {
  return (
    <ComponentPage
      id="item"
      title="Item"
      description="A flexible list item with media, content and actions."
      sections={itemSections}
    />
  );
}
