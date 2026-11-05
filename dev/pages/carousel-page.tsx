import { ComponentPage } from "../examples/shared";
import { carouselSections } from "../examples/carousel";

export default function CarouselPage() {
  return (
    <ComponentPage
      id="carousel"
      title="Carousel"
      description="A carousel with motion and swipe built using CSS and pointer events."
      sections={carouselSections}
    />
  );
}
