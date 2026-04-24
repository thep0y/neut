import { splitProps } from "solid-js";
import type { BreadcrumbPageProps } from "./BreadcrumbPage.types";
import { classes } from "./BreadcrumbPage.styles";
import { clsx } from "~/utils";

export const BreadcrumbPage = (props: BreadcrumbPageProps) => {
  const [local, others] = splitProps(props, ["class", "classList"]);

  return (
    <span
      role="link"
      data-slot="breadcrumb-page"
      tabIndex={0}
      aria-disabled="true"
      aria-current="page"
      class={clsx(classes, local.class)}
      {...others}
    />
  );
};
