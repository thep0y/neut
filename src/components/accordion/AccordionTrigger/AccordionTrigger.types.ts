import type { BaseProps, PolymorphicProps } from "~/types";

interface BaseAccordionTriggerProps extends BaseProps {
  nativeButton?: boolean;
}

export type AccordionTriggerProps = PolymorphicProps<
  "div",
  BaseAccordionTriggerProps,
  false
>;
