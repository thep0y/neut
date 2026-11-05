import { ComponentPage } from "../examples/shared";
import { tabsSections } from "../examples/tabs";

export default function TabsPage() {
  return (
    <ComponentPage
      id="tabs"
      title="Tabs"
      description="A set of layered sections of content."
      sections={tabsSections}
    />
  );
}
