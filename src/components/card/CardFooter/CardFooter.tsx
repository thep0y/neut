import { splitProps } from "solid-js";
import type { CardFooterProps } from "./CardFooter.types";
import { clsx } from "~/lib/utils";
import { classes } from "./CardFooter.styles";

export const CardFooter = (props: CardFooterProps) => {
  const [local, rest] = splitProps(props, ["class", "classList"]);

  return (
    <div data-slot="card-footer" class={clsx(classes, local.class)} {...rest} />
  );
};
