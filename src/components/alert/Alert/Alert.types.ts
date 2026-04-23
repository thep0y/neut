import type { VariantProps } from "class-variance-authority";
import type { BaseProps, PolymorphicProps } from "~/types";
import type { alertVariants } from "./Alert.styles";

export type AlertProps = PolymorphicProps<
  "div",
  BaseProps & VariantProps<typeof alertVariants>,
  false
>;
