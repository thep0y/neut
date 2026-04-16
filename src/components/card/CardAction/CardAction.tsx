import { splitProps } from "solid-js";
import type { CardActionProps } from "./CardAction.types";
import { clsx } from "~/lib/utils";
import { classes } from "./CardAction.styles";

export const CardAction = (props: CardActionProps) => {
  const [local, rest] = splitProps(props, ["class", "classList"]);

  return (
    <div data-slot="card-action" class={clsx(classes, local.class)} {...rest} />
  );
};
