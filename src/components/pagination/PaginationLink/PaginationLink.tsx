import { mergeProps, splitProps } from "solid-js";
import type { PaginationLinkProps } from "./PaginationLink.types";
import { clsx } from "~/lib/utils";
import Button from "~/components/button";

export const PaginationLink = (props: PaginationLinkProps) => {
  const merged = mergeProps({ size: "md" } as const, props);

  const [local, others] = splitProps(merged, [
    "size",
    "isActive",
    "class",
    "classList",
    // @ts-expect-error
    "page",
    // @ts-expect-error
    "children",
  ]);

  return (
    <Button
      as="a"
      variant={local.isActive ? "outline" : "ghost"}
      size={local.size}
      aria-current={local.isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={local.isActive}
      class={clsx(local.class)}
      icon={"page" in local ? (local.page as number) : undefined}
      {...others}
    >
      {/* @ts-expect-error page和children只能存在一个*/}
      {local.children}
    </Button>
  );
};
