import type { JSX, JSXElement } from "solid-js";
import type { ButtonProps } from "~/components/button";

export type PaginationLinkProps = Pick<ButtonProps<"a">, "size" | "onClick"> & {
  isActive?: boolean;
} & Omit<JSX.IntrinsicElements["a"], "children" | "onClick"> &
  ({ page: number; children?: never } | { page?: never; children: JSXElement });
