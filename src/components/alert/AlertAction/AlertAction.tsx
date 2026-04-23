import { splitProps } from "solid-js";
import type { AlertActionProps } from "./AlertAction.types";
import { clsx } from "~/utils";
import { classes } from "./AlertAction.styles";

export const AlertAction = (props: AlertActionProps) => {
  const [local, others] = splitProps(props, ["class", "classList"]);

  return (
    <div
      data-slot="alert-action"
      class={clsx(classes, local.class)}
      {...others}
    />
  );
};
