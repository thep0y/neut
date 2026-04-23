import type { BaseProps, PolymorphicProps } from "~/types";

interface BaseSliderProps {
  defaultValue?: number[];
  value?: number[];
  min?: number;
  max?: number;
  step?: number;
  orientation?: "horizontal" | "vertical";
  onValueChange?: (value: number[]) => void;
  disabled?: boolean;
}

export type SliderProps = PolymorphicProps<
  "div",
  BaseProps & BaseSliderProps,
  false
>;
