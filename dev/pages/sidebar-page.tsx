import { ComponentPage } from "../examples/shared";
import { sidebarSections } from "../examples/sidebar";

export default function SidebarPage() {
  return (
    <ComponentPage
      id="sidebar"
      title="Sidebar"
      description="A composable, themeable sidebar layout."
      sections={sidebarSections}
    />
  );
}
