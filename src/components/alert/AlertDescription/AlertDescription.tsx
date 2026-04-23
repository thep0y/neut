import { splitProps } from "solid-js";
import type { AlertDescriptionProps } from "./AlertDescription.types";
import { clsx } from "~/utils";
import { classes } from "./AlertDescription.styles";

export const AlertDescription = (props: AlertDescriptionProps) => {
  const [local, others] = splitProps(props, ["class", "classList"]);

  return (
    <div
      data-slot="alert-description"
      class={clsx(classes, local.class)}
      {...others}
    />
  );
};
