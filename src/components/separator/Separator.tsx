import { mergeProps, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { classes } from "./Separator.styles";
import type { SeparatorProps } from "./Separator.types";

export const Separator = (props: SeparatorProps) => {
  const merged = mergeProps({ orientation: "horizontal" } as const, props);
  const [local, others] = splitProps(merged, [
    "orientation",
    "decorative",
    "class",
    "classList",
  ]);

  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: role 为 separator 时支持 aria-orientation
    <div
      data-slot="separator"
      role={local.decorative ? "none" : "separator"}
      aria-orientation={local.decorative ? undefined : local.orientation}
      data-orientation={local.orientation}
      data-horizontal={local.orientation === "horizontal" ? "" : undefined}
      data-vertical={local.orientation === "vertical" ? "" : undefined}
      class={clsx(classes, local.class)}
      classList={local.classList}
      {...others}
    />
  );
};
