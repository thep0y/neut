import { splitProps } from "solid-js";
import type { AlertProps } from "./Alert.types";
import { clsx } from "~/utils";
import { alertVariants } from "./Alert.styles";

export const Alert = (props: AlertProps) => {
  const [local, others] = splitProps(props, ["variant", "class", "classList"]);

  return (
    <div
      data-slot="alert"
      role="alert"
      class={clsx(alertVariants({ variant: local.variant }), local.class)}
      {...others}
    />
  );
};
