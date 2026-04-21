import type { BaseProps, PolymorphicProps } from "~/types";

export type AccordionValue = string | number;

interface BaseAccordionProps extends BaseProps {
  defaultValue?: AccordionValue[];
  value?: AccordionValue[];
  onValueChange?: (value: AccordionValue[]) => void;
  hiddenUntilFound?: boolean;
  loopFocus?: boolean;
  multiple?: boolean;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  keepMounted?: boolean;
}

export type AccordionProps = PolymorphicProps<
  "section",
  BaseAccordionProps,
  false
>;

export interface ItemEntry {
  id: symbol;
  value?: AccordionValue;
  isOpen: boolean;
}
