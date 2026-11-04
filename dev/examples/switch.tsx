import { createSignal } from "solid-js";
import { Switch } from "~/index";
import type { Section } from "./shared";

function SwitchBasic() {
  return (
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-2">
        <Switch id="airplane-mode" aria-labelledby="airplane-mode-label" />
        <span id="airplane-mode-label" class="text-sm">
          Airplane mode
        </span>
      </div>
      <div class="flex items-center gap-2">
        <Switch id="wifi" defaultChecked aria-labelledby="wifi-label" />
        <span id="wifi-label" class="text-sm">
          Wi-Fi
        </span>
      </div>
    </div>
  );
}

function SwitchControlled() {
  const [checked, setChecked] = createSignal(false);

  return (
    <div class="flex items-center gap-3">
      <Switch
        checked={checked()}
        onCheckedChange={setChecked}
        aria-label="Notifications"
      />
      <span class="text-sm text-muted-foreground">
        Notifications: {checked() ? "on" : "off"}
      </span>
    </div>
  );
}

function SwitchSizes() {
  return (
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2">
        <Switch size="sm" defaultChecked aria-label="Small switch" />
        <span class="text-sm">Small</span>
      </div>
      <div class="flex items-center gap-2">
        <Switch size="md" defaultChecked aria-label="Medium switch" />
        <span class="text-sm">Medium</span>
      </div>
    </div>
  );
}

function SwitchDisabled() {
  return (
    <div class="flex items-center gap-4">
      <Switch disabled aria-label="Disabled off" />
      <Switch disabled defaultChecked aria-label="Disabled on" />
    </div>
  );
}

export const switchSections: Section[] = [
  {
    id: "switch-basic",
    title: "Basic",
    description: "A control that toggles between checked and unchecked.",
    component: SwitchBasic,
  },
  {
    id: "switch-controlled",
    title: "Controlled",
    description: "Read and write the checked state from your own signal.",
    component: SwitchControlled,
  },
  {
    id: "switch-sizes",
    title: "Sizes",
    description: "Small and medium switch sizes.",
    component: SwitchSizes,
  },
  {
    id: "switch-disabled",
    title: "Disabled",
    description: "Disabled switches are not interactive.",
    component: SwitchDisabled,
  },
];
