import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/index";
import type { Section } from "./shared";

const SLIDES = [1, 2, 3, 4, 5];

function Slide(props: { index: number; value: number }) {
  return (
    <CarouselItem index={props.index}>
      <div class="flex aspect-square items-center justify-center rounded-xl bg-muted text-4xl font-semibold">
        {props.value}
      </div>
    </CarouselItem>
  );
}

function CarouselBasic() {
  return (
    <div class="w-full max-w-md px-12">
      <Carousel loop class="w-full">
        <CarouselContent>
          {SLIDES.map((value, index) => (
            <Slide index={index} value={value} />
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

function CarouselAutoplay() {
  return (
    <div class="w-full max-w-md">
      <Carousel autoPlay autoPlayInterval={2500} loop class="w-full">
        <CarouselContent>
          {SLIDES.map((value, index) => (
            <Slide index={index} value={value} />
          ))}
        </CarouselContent>
        <CarouselDots />
      </Carousel>
    </div>
  );
}

function CarouselVertical() {
  return (
    <div class="h-80 w-full max-w-md py-12">
      <Carousel orientation="vertical" loop class="h-full w-full">
        <CarouselContent class="h-full">
          {SLIDES.map((value, index) => (
            <Slide index={index} value={value} />
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
}

export const carouselSections: Section[] = [
  {
    id: "carousel-basic",
    title: "Basic",
    description: "A horizontal carousel with previous and next buttons.",
    component: CarouselBasic,
  },
  {
    id: "carousel-autoplay",
    title: "Autoplay",
    description: "Advance slides automatically and show dot navigation.",
    component: CarouselAutoplay,
  },
  {
    id: "carousel-vertical",
    title: "Vertical",
    description: "Set orientation to vertical for a vertical carousel.",
    component: CarouselVertical,
  },
];
