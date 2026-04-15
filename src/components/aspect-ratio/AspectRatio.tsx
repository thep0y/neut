import { splitProps } from "solid-js";
import type { AspectRatioProps } from "./AspectRatio.types";
import { clsx } from "~/lib/utils";
import { classes } from "./AspectRatio.styles";

export const AspectRatio = (props: AspectRatioProps) => {
  const [local, others] = splitProps(props, ["ratio", "class", "classList"]);

  return (
    <div
      data-slot="aspect-ratio"
      style={{ "--ratio": props.ratio }}
      class={clsx(classes, local.class)}
      {...others}
    />
  );
};
