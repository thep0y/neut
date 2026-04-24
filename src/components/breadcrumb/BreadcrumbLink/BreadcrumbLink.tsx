import { mergeProps, splitProps, type ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";
import type {
  BreadcrumbLinkProps,
  ResolvedBreadcrumbLinkProps,
} from "./BreadcrumbLink.types";
import { clsx } from "~/utils";
import { classes } from "./BreadcrumbLink.styles";

export const BreadcrumbLink = <T extends ValidComponent = "a">(
  props: BreadcrumbLinkProps<T>,
) => {
  const merged = mergeProps(
    { as: "a" as ValidComponent } as const,
    props as ResolvedBreadcrumbLinkProps,
  );

  const [local, others] = splitProps(merged, [
    "as",
    "href",
    "class",
    "classList",
  ]);

  return (
    <Dynamic
      component={local.as}
      href={local.href}
      data-slot="breadcrumb-link"
      class={clsx(classes, local.class)}
      {...others}
    />
  );
};
