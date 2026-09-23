import { ComponentPage } from "../examples/shared";
import { contextMenuSections } from "../examples/context-menu";

export default function ContextMenuPage() {
  return (
    <ComponentPage
      id="context-menu"
      title="Context Menu"
      description="Displays a menu of actions triggered by a right click."
      sections={contextMenuSections}
    />
  );
}
