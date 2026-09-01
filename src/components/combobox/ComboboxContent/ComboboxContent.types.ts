import type { JSX } from "solid-js";
import type { Alignment, Side } from "~/lib";
import type { BaseProps, PolymorphicProps } from "~/types";

interface BaseComboboxContentProps extends BaseProps {
  side?: Side;
  align?: "center" | Alignment;
  sideOffset?: number;
  alignOffset?: number;
  children?: JSX.Element;
}

export type ComboboxContentProps = PolymorphicProps<
  "div",
  BaseComboboxContentProps,
  false
>;
