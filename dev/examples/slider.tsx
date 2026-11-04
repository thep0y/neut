import { createSignal } from "solid-js";
import { Slider } from "~/index";
import type { Section } from "./shared";

function SliderBasic() {
  return (
    <Slider defaultValue={50} aria-label="Volume" class="w-full max-w-sm" />
  );
}

function SliderRange() {
  return (
    <Slider
      defaultValue={[25, 75]}
      aria-label="Price range"
      class="w-full max-w-sm"
    />
  );
}

function SliderStep() {
  return (
    <Slider
      defaultValue={50}
      step={10}
      aria-label="Step"
      class="w-full max-w-sm"
    />
  );
}

function SliderControlled() {
  const [value, setValue] = createSignal(40);

  return (
    <div class="flex w-full max-w-sm flex-col gap-2">
      <Slider
        value={value()}
        onValueChange={setValue}
        aria-label="Brightness"
      />
      <span class="text-sm text-muted-foreground">Brightness: {value()}</span>
    </div>
  );
}

function SliderVertical() {
  return (
    <div class="flex h-40 items-center">
      <Slider
        orientation="vertical"
        defaultValue={60}
        aria-label="Vertical volume"
      />
    </div>
  );
}

function SliderDisabled() {
  return (
    <Slider
      defaultValue={30}
      disabled
      aria-label="Disabled slider"
      class="w-full max-w-sm"
    />
  );
}

export const sliderSections: Section[] = [
  {
    id: "slider-basic",
    title: "Basic",
    description: "A single value slider.",
    component: SliderBasic,
  },
  {
    id: "slider-range",
    title: "Range",
    description: "Pass an array to render multiple thumbs.",
    component: SliderRange,
  },
  {
    id: "slider-step",
    title: "Step",
    description: "Use step to control the increment.",
    component: SliderStep,
  },
  {
    id: "slider-controlled",
    title: "Controlled",
    description: "Drive the value from your own signal.",
    component: SliderControlled,
  },
  {
    id: "slider-vertical",
    title: "Vertical",
    description: 'Set orientation="vertical" for a vertical slider.',
    component: SliderVertical,
  },
  {
    id: "slider-disabled",
    title: "Disabled",
    description: "Disabled sliders are not interactive.",
    component: SliderDisabled,
  },
];
