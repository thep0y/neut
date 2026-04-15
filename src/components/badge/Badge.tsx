import { clsx } from "~/lib/utils";
import type { BadgeProps } from "./Badge.types";
import { badgeVariants } from "./Badge.styles";
import { splitProps } from "solid-js";

export const Badge = (props: BadgeProps) => {
  const [local, others] = splitProps(props, ["variant", "class", "classList"]);

  return (
    <span
      class={clsx(badgeVariants({ variant: local.variant }), local.class)}
      {...others}
    />
  );
};
