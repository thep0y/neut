import { splitProps } from "solid-js";
import type { SpinnerProps } from "./Spinner.types";
import { LoaderCircle } from "lucide-solid";
import { clsx } from "~/lib/utils";
import { classes } from "./Spinner.styles";

export const Spinner = (props: SpinnerProps) => {
  const [local, others] = splitProps(props, ["class", "classList"]);

  return (
    <LoaderCircle
      class={clsx(classes, local.class)}
      role="status"
      aria-label="Loading"
      {...others}
    />
  );
};
