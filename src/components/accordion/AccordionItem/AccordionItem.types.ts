import type { BaseProps, PolymorphicProps } from "~/types";

interface BaseAccordionItemProps<T> extends BaseProps {
  value?: T;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

export type AccordionItemProps<T> = PolymorphicProps<
  "div",
  BaseAccordionItemProps<T>,
  false
>;
