import { ComponentPage } from "../examples/shared";
import { drawerSections } from "../examples/drawer";

export default function DrawerPage() {
  return (
    <ComponentPage
      id="drawer"
      title="Drawer"
      description="A drawer component that slides in from the edge of the screen."
      sections={drawerSections}
    />
  );
}
