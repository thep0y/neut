import type { BaseProps, PolymorphicProps } from "~/types";

interface BaseAccordionContentProps extends BaseProps {
  hiddenUntilFound?: boolean;
  keepMounted?: boolean;
}

export type AccordionContentProps = PolymorphicProps<
  "div",
  BaseAccordionContentProps,
  false
>;
