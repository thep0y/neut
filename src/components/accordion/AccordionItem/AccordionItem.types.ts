import type { BaseProps, PolymorphicProps } from "~/types";
import type { AccordionValue } from "../Accordion";

interface BaseAccordionItemProps extends BaseProps {
  value?: AccordionValue;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

export type AccordionItemProps = PolymorphicProps<
  "div",
  BaseAccordionItemProps,
  false
>;
