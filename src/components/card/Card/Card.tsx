import { mergeProps, splitProps } from "solid-js";
import type { CardProps } from "./Card.types";
import { clsx } from "~/lib/utils";
import { classes } from "~/components/card/Card/Card.styles";

export const Card = (props: CardProps) => {
  const merged = mergeProps({ size: "md" } as const, props);
  const [local, others] = splitProps(merged, ["size", "class", "classList"]);

  return (
    <div
      data-slot="card"
      data-size={local.size}
      class={clsx(classes, local.class)}
      {...others}
    />
  );
};
