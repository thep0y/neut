import type { BaseProps, PolymorphicProps } from "~/types";

export type BreadcrumbEllipsisProps = Omit<
  PolymorphicProps<"span", BaseProps, false>,
  "children"
>;
