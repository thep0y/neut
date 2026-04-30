import type { JSXElement } from "solid-js";
import type { ButtonProps } from "~/components/button";
import type { HTMLAttributes } from "~/types";

export type PaginationLinkProps = Pick<ButtonProps<"a">, "size" | "onClick"> & {
  isActive?: boolean;
} & Omit<HTMLAttributes<"a">, "children" | "onClick"> &
  ({ page: number; children?: never } | { page?: never; children: JSXElement });
