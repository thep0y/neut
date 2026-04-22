import { mergeProps, splitProps } from "solid-js";
import type { PaginationPreviousProps } from "./PaginationPrevious.types";
import { PaginationLink } from "../PaginationLink";
import { clsx } from "~/utils";
import { ChevronLeft } from "lucide-solid";

export const PaginationPrevious = (props: PaginationPreviousProps) => {
  const merged = mergeProps({ text: "Previous" }, props);

  const [local, others] = splitProps(merged, ["text", "class", "classList"]);

  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="md"
      class={clsx("pl-1.5!", local.class)}
      {...others}
    >
      <ChevronLeft data-icon="inline-start" class="cn-rtl-flip" />
      <span class="hidden sm:block">{local.text}</span>
    </PaginationLink>
  );
};
