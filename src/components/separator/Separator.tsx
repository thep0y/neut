import { mergeProps, splitProps } from "solid-js";
import type { SeparatorProps } from "./Separator.types";
import { clsx } from "~/lib/utils";
import { classes } from "./Separator.styles";

export const Separator = (props: SeparatorProps) => {
  const merged = mergeProps({ orientation: "horizontal" } as const, props);
  const [local, others] = splitProps(merged, [
    "orientation",
    "class",
    "classList",
  ]);

  return (
    <div
      data-slot="separator"
      data-orientation={local.orientation}
      data-horizontal={local.orientation === "horizontal" ? "" : undefined}
      data-vertical={local.orientation === "vertical" ? "" : undefined}
      class={clsx(classes, local.class)}
      {...others}
    />
  );
};
