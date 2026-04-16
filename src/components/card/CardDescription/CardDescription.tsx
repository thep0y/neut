import { splitProps } from "solid-js";
import type { CardDescriptionProps } from "./CardDescription.types";
import { clsx } from "~/lib/utils";
import { classes } from "./CardDescription.styles";

export const CardDescription = (props: CardDescriptionProps) => {
  const [local, rest] = splitProps(props, ["class", "classList"]);

  return (
    <div
      data-slot="card-description"
      class={clsx(classes, local.class)}
      {...rest}
    />
  );
};
