import { ComponentPage } from "../examples/shared";
import { switchSections } from "../examples/switch";

export default function SwitchPage() {
  return (
    <ComponentPage
      id="switch"
      title="Switch"
      description="A control that allows the user to toggle between checked and not checked."
      sections={switchSections}
    />
  );
}
