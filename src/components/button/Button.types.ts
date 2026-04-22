import type { JSXElement } from "solid-js";
import type {
  BaseProps,
  MakeRequired,
  MouseEventHandler,
  PolymorphicProps,
} from "~/types";

export type ButtonVariant =
  | "primary"
  | "outline"
  | "secondary"
  | "ghost"
  | "destructive"
  | "link";

export type ButtonSize = "md" | "xs" | "sm" | "lg";

interface BaseButtonProps extends BaseProps {
  variant?: ButtonVariant;

  size?: ButtonSize;

  /** Button content */
  children?: JSXElement;

  icon?: JSXElement;

  iconPosition?: "left" | "right";

  id?: string;
}

export type ButtonValidElement = "button" | "a";

export type ButtonProps<T extends ButtonValidElement> = PolymorphicProps<
  T,
  BaseButtonProps & { onClick?: MouseEventHandler<T> }
>;

export type DefaultStyleProps = MakeRequired<
  BaseButtonProps,
  "size" | "variant"
> & { as: ButtonValidElement };

export type ButtonPropsWithDefault<T extends ButtonValidElement> =
  PolymorphicProps<T, BaseButtonProps & { onClick?: MouseEventHandler<T> }>;
