import type { BaseProps, PolymorphicProps } from "~/types";

interface BaseAccordionProps<T> extends BaseProps {
  defaultValue?: T[];
  value?: T[];
  onValueChange?: (value: T[]) => void;
  hiddenUntilFound?: boolean;
  loopFocus?: boolean;
  multiple?: boolean;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  keepMounted?: boolean;
}

export type AccordionProps<T> = PolymorphicProps<
  "section",
  BaseAccordionProps<T>,
  false
>;

export interface ItemEntry<T> {
  id: symbol;
  value?: T;
  isOpen: boolean;
}
