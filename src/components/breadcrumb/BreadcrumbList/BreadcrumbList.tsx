import { splitProps } from "solid-js";
import type { BreadcrumbListProps } from "./BreadcrumbList.types";
import { clsx } from "~/utils";
import { classes } from "./BreadcrumbList.styles";

export const BreadcrumbList = (props: BreadcrumbListProps) => {
  const [local, others] = splitProps(props, ["class", "classList"]);

  return (
    <ol
      data-slot="breadcrumb-list"
      class={clsx(classes, local.class)}
      {...others}
    />
  );
};
