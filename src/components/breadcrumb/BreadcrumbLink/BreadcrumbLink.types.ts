import type { ValidComponent, JSX, ComponentProps } from "solid-js";
import type { BaseProps, PolymorphicProps, ResolvedProps } from "~/types";

type IsACompatible<T extends ValidComponent> = T extends "a"
  ? true
  : ComponentProps<T> extends Pick<
        JSX.AnchorHTMLAttributes<HTMLAnchorElement>,
        "href"
      >
    ? true
    : false;

export type BreadcrumbLinkProps<
  T extends ValidComponent = "a",
  _Check = IsACompatible<T> extends true
    ? true
    : ["Error: T must be 'a' or a-compatible component", T],
> = PolymorphicProps<T, BaseProps>;

export type ResolvedBreadcrumbLinkProps = ResolvedProps<
  BreadcrumbLinkProps<"a">,
  "a"
>;
