import { mergeProps, Show, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";

import type {
  ButtonProps,
  ButtonValidElement,
  DefaultStyleProps,
} from "./Button.types";
import { clsx } from "~/lib/utils";
import s from "./Button.styles";

export const Button = <T extends ButtonValidElement = "button">(
  props: ButtonProps<T>,
) => {
  const merged = mergeProps(
    {
      variant: "primary",
      size: "md",
      as: "button",
      iconPosition: "left",
    } satisfies Partial<DefaultStyleProps>,
    props,
  );

  const [local, others] = splitProps(merged, [
    "as",
    "variant",
    "size",
    "icon",
    "iconPosition",
    "class",
    "classList",
    "children",
  ]);

  const iconOnly = () => !!local.icon && !local.children;

  const iconWithAttr = (position: "inline-start" | "inline-end") => (
    <span data-icon={position}>{local.icon}</span>
  );

  return (
    // @ts-expect-error
    <Dynamic
      component={local.as}
      class={clsx(
        s({
          variant: local.variant,
          size: iconOnly() ? undefined : local.size,
          iconSize: iconOnly() ? local.size : undefined,
        }),
      )}
      {...others}
    >
      <Show when={local.icon && local.iconPosition === "left"}>
        <Show when={!iconOnly()} fallback={local.icon}>
          {iconWithAttr("inline-start")}
        </Show>
      </Show>
      {local.children}
      <Show when={local.icon && local.iconPosition === "right"}>
        <Show when={!iconOnly()} fallback={local.icon}>
          {iconWithAttr("inline-end")}
        </Show>
      </Show>
    </Dynamic>
  );
};
