import type { ValidComponent } from "solid-js";
import type { VariantProps } from "class-variance-authority";
import type { BaseProps, PolymorphicProps } from "~/types";
import type { markerVariants } from "./Marker.styles";

export type MarkerProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  BaseProps & VariantProps<typeof markerVariants>
>;
