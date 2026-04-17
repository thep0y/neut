import type { JSX, JSXElement } from "solid-js";
import type { ButtonProps } from "~/components/button";

export type PaginationLinkProps = Pick<ButtonProps<"a">, "size"> & {
  isActive?: boolean;
} & Omit<JSX.IntrinsicElements["a"], "children"> &
  ({ page: number; children?: never } | { page?: never; children: JSXElement });
