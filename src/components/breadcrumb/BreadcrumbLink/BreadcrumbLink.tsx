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
    { component: "a" as ValidComponent } as const,
    props as ResolvedBreadcrumbLinkProps,
  );

  const [local, others] = splitProps(merged, [
    "component",
    "href",
    "class",
    "classList",
  ]);

  return (
    <Dynamic
      component={local.component}
      href={local.href}
      data-slot="breadcrumb-link"
      class={clsx(classes, local.class)}
      {...others}
    />
  );
};
