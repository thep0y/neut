import { ComponentPage } from "../examples/shared";
import { sliderSections } from "../examples/slider";

export default function SliderPage() {
  return (
    <ComponentPage
      id="slider"
      title="Slider"
      description="An input where the user selects a value from within a given range."
      sections={sliderSections}
    />
  );
}
