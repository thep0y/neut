import { splitProps } from "solid-js";
import type { BreadcrumbItemProps } from "./BreadcrumbItem.types";
import { clsx } from "~/utils";
import { classes } from "./BreadcrumbItem.styles";

export const BreadcrumbItem = (props: BreadcrumbItemProps) => {
  const [local, others] = splitProps(props, ["class", "classList"]);

  return (
    <li
      data-slot="breadcrumb-item"
      class={clsx(classes, local.class)}
      {...others}
    />
  );
};
