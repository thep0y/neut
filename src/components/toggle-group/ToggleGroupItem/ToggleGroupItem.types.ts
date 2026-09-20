import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "solid-js";
import type { toggleVariants } from "~/components/toggle/Toggle/Toggle.styles";
import type { HTMLAttributes, PolymorphicProps } from "~/types";

type BaseToggleGroupItemProps = VariantProps<typeof toggleVariants> &
  HTMLAttributes<"button"> & {
    /** 当前 item 的唯一值 */
    value: string;
    /** 组件内部会先处理选中,再调用用户回调(与 tabs 的 trigger 一致) */
    onClick?: ComponentProps<"button">["onClick"];
    /** 聚焦即更新 roving focus 高亮,用户回调会被一并调用 */
    onFocus?: ComponentProps<"button">["onFocus"];
  };

export type ToggleGroupItemProps = PolymorphicProps<
  "button",
  BaseToggleGroupItemProps,
  false
>;
