import { splitProps } from "solid-js";
import type { BreadcrumbEllipsisProps } from "./BreadcrumbEllipsis.types";
import { classes } from "./BreadcrumbEllipsis.styles";
import { clsx } from "~/utils";
import { Ellipsis } from "lucide-solid";

export const BreadcrumbEllipsis = (props: BreadcrumbEllipsisProps) => {
  const [local, others] = splitProps(props, ["class", "classList"]);

  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      class={clsx(classes, local.class)}
      {...others}
    >
      <Ellipsis />
      <span class="sr-only">More</span>
    </span>
  );
};
