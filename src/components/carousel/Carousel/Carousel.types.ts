import type { BaseProps, PolymorphicProps } from "~/types";

export type Orientation = "horizontal" | "vertical";

export interface CarouselOptions {
  loop?: boolean;
  orientation?: Orientation;
  autoPlay?: boolean;
  autoPlayInterval?: number;
}

type BaseCarouselProps = BaseProps & CarouselOptions;

export type CarouselProps = PolymorphicProps<
  "section",
  BaseCarouselProps,
  false
>;
