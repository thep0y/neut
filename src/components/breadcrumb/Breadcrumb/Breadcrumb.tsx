import type { BreadcrumbProps } from "./Breadcrumb.types";

export const Breadcrumb = (props: BreadcrumbProps) => {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
};
