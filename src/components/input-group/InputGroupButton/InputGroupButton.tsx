import { Button } from "~/components/button/Button";
import type { InputGroupButtonProps } from "./InputGroupButton.types";
import { mergeProps, splitProps } from "solid-js";
import { clsx } from "~/lib/utils";
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

  return (
    <Button
      data-size={local.size}
      variant={local.variant}
      class={clsx(inputGroupButtonVariants({ size: local.size }), local.class)}
      {...others}
    />
  );
};
