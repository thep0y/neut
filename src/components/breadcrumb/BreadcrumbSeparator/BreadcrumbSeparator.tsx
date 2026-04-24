import { Show, splitProps } from "solid-js";
import type { BreadcrumbSeparatorProps } from "./BreadcrumbSeparator.types";
import { classes } from "./BreadcrumbSeparator.styles";
import { clsx } from "~/utils";
import { ChevronRight } from "lucide-solid";

export const BreadcrumbSeparator = (props: BreadcrumbSeparatorProps) => {
  const [local, others] = splitProps(props, ["class", "classList", "children"]);

  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      class={clsx(classes, local.class)}
      {...others}
    >
      <Show
        when={local.children}
        fallback={<ChevronRight class="cn-rtl-flip" />}
      >
        {local.children}
      </Show>
    </li>
  );
};
