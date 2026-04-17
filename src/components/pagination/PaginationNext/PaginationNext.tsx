import { mergeProps, splitProps } from "solid-js";
import type { PaginationNextProps } from "./PaginationNext.types";
import { PaginationLink } from "../PaginationLink";
import { clsx } from "~/lib/utils";
import { ChevronRight } from "lucide-solid";

export const PaginationNext = (props: PaginationNextProps) => {
  const merged = mergeProps({ text: "Next" }, props);

  const [local, others] = splitProps(merged, ["text", "class", "classList"]);

  return (
    <PaginationLink
      aria-label="Go to next page"
      size="md"
      class={clsx("pr-1.5!", local.class)}
      {...others}
    >
      <span class="hidden sm:block">{local.text}</span>
      <ChevronRight data-icon="inline-end" class="cn-rtl-flip" />
    </PaginationLink>
  );
};
