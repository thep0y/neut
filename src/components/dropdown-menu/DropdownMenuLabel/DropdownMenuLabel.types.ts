import type { BaseProps, PolymorphicProps } from "~/types";

export type DropdownMenuLabelProps = PolymorphicProps<
  "div",
  BaseProps & { inset?: boolean },
  false
>;
