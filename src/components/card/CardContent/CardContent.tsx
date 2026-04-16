import { splitProps } from "solid-js";
import type { CardContentProps } from "./CardContent.types";
import { clsx } from "~/lib/utils";
import { classes } from "./CardContent.styles";

export const CardContent = (props: CardContentProps) => {
  const [local, rest] = splitProps(props, ["class", "classList"]);

  return (
    <div
      data-slot="card-content"
      class={clsx(classes, local.class)}
      {...rest}
    />
  );
};
