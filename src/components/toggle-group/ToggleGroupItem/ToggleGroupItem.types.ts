import type { VariantProps } from "class-variance-authority";
import type { ComponentProps } from "solid-js";
import type { toggleVariants } from "~/components/toggle/Toggle/Toggle.styles";

export interface ToggleGroupItemProps
  extends ComponentProps<"button">,
    VariantProps<typeof toggleVariants> {
  /** 当前 item 的唯一值 */
  value: string;
  /** 默认从 ToggleGroup context 继承；可单独覆盖 */
  variant?: "default" | "outline";
  size?: "default" | "sm" | "lg";
}
