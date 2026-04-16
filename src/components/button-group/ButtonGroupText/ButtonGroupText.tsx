import { clsx } from "~/lib/utils";
import type { ButtonGroupTextProps } from "./ButtonGroupText.types";
import { classes } from "./ButtonGroupText.styles";

export const ButtonGroupText = (props: ButtonGroupTextProps) => {
  return (
    <div
      data-slot="button-group-text"
      class={clsx(classes, props.class)}
      {...props}
    />
  );
};
