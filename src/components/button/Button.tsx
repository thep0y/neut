import {
  createMemo,
  createUniqueId,
  mergeProps,
  Show,
  splitProps,
} from "solid-js";
import { Dynamic } from "solid-js/web";
import { clsx } from "~/utils";
import s from "./Button.styles";
import type {
  ButtonProps,
  ButtonValidElement,
  DefaultStyleProps,
} from "./Button.types";

export const Button = <T extends ButtonValidElement = "button">(
  props: ButtonProps<T>,
) => {
  const merged = mergeProps(
    {
      variant: "primary",
      size: "md",
      as: "button",
      iconPosition: "left",
      id: createUniqueId(),
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
    "onClick",
  ]);

  const iconOnly = createMemo(() => !!local.icon && !local.children);

  const iconWithAttr = (position: "inline-start" | "inline-end") => (
    <span data-icon={position}>{local.icon}</span>
  );

  return (
    // @ts-expect-error
    <Dynamic
      data-slot="button"
      component={local.as}
      onClick={local.onClick}
      class={clsx(
        s({
          variant: local.variant,
          size: iconOnly() ? undefined : local.size,
          iconSize: iconOnly() ? local.size : undefined,
        }),
        local.class,
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
