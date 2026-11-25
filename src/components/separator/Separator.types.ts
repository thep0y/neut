import type { JSX } from "solid-js";
import type { BaseProps, PolymorphicProps } from "~/types";

interface BaseSeparatorProps extends BaseProps {
  orientation?: "horizontal" | "vertical";
  style?: JSX.CSSProperties;
  /** 纯装饰分隔线：不进入无障碍树，默认 false */
  decorative?: boolean;
}

export type SeparatorProps = PolymorphicProps<"div", BaseSeparatorProps, false>;
