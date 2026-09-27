import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import type { MarkerContentProps } from "./MarkerContent.types";

export function MarkerContent(props: MarkerContentProps) {
  const [local, rest] = splitProps(props, ["class", "classList"]);
  return (
    <span
      {...rest}
      data-slot="marker-content"
      class={clsx(
        "min-w-0 break-words group-data-[variant=separator]/marker:flex-none group-data-[variant=separator]/marker:text-center *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        local.class,
      )}
      classList={local.classList}
    />
  );
}
