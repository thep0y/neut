import type { JSX, JSXElement } from "solid-js";
import type { MakeRequired, PolymorphicProps } from "~/types";

export type ButtonVariant =
  | "primary"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";

export type ButtonSize = "md" | "xs" | "sm" | "lg";

interface BaseButtonProps {
  variant?: ButtonVariant;

  size?: ButtonSize;

  class?: string;

  /** Additional CSS classes */
  classList?: Record<string, boolean>;

  /** Button content */
  children?: JSX.Element;

  icon?: JSXElement;

  iconPosition?: "left" | "right";
}

export type ButtonValidElement = "button" | "a";

export type ButtonProps<T extends ButtonValidElement> = PolymorphicProps<
  T,
  BaseButtonProps
>;

export type DefaultStyleProps = MakeRequired<
  BaseButtonProps,
  "size" | "variant"
> & { as: ButtonValidElement };

export type ButtonPropsWithDefault<T extends ButtonValidElement> =
  PolymorphicProps<T, BaseButtonProps>;
