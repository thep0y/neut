import { Button } from "~/components/button/Button";
import type { InputGroupButtonProps } from "./InputGroupButton.types";
import { mergeProps, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { inputGroupButtonVariants } from "./InputGroupButton.styles";

export const InputGroupButton = (props: InputGroupButtonProps) => {
  const merged = mergeProps(
    { type: "button", variant: "ghost", size: "xs" } as const,
    props,
  );
  const [local, others] = splitProps(merged, [
    "size",
    "variant",
    "class",
    "classList",
  ]);

  const iconOnly = () => !!others.icon && !others.children;

  return (
    <Button
      data-size={local.size}
      variant={local.variant}
      class={clsx(
        inputGroupButtonVariants({
          size: iconOnly() ? undefined : local.size,
          iconSize: iconOnly() ? local.size : undefined,
        }),
        local.class,
      )}
      {...others}
    />
  );
};
