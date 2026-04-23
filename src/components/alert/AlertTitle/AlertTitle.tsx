import { splitProps } from "solid-js";
import type { AlertTitleProps } from "./AlertTitle.types";
import { clsx } from "~/utils";
import { classes } from "./AlertTitle.styles";

export const AlertTitle = (props: AlertTitleProps) => {
  const [local, others] = splitProps(props, ["class", "classList"]);

  return (
    <div
      data-slot="alert-title"
      class={clsx(classes, local.class)}
      {...others}
    />
  );
};
