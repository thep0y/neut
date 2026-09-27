import type { VariantProps } from "class-variance-authority";
import type { BaseProps, PolymorphicProps } from "~/types";
import type { bubbleVariants } from "./Bubble.styles";

export type BubbleAlign = "start" | "end";

export type BubbleProps = PolymorphicProps<
  "div",
  BaseProps &
    VariantProps<typeof bubbleVariants> & {
      /** 气泡的行内对齐，默认 "start" */
      align?: BubbleAlign;
    },
  false
>;
