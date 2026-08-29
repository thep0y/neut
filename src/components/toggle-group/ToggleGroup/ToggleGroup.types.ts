import type { Accessor, ParentProps } from "solid-js";
import type { VariantProps } from "class-variance-authority";
import type { toggleVariants } from "~/components/toggle/Toggle/Toggle.styles";

export interface ToggleGroupProps
  extends ParentProps,
    VariantProps<typeof toggleVariants> {
  /** 受控选中值（数组）；不传则内部自管理 */
  value?: string[];
  /** 非受控模式下的初始选中值 */
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** 是否允许同时选中多个，默认 false */
  multiple?: boolean;
  disabled?: boolean;
  orientation?: "horizontal" | "vertical";
  /** 项目之间的间距，通过 --gap 变量实现，默认 2 */
  spacing?: number;
  class?: string;
  dir?: "ltr" | "rtl" | "auto";
}

export interface ToggleGroupContextValue {
  value: Accessor<string[]>;
  setValue: (value: string[]) => void;
  multiple: Accessor<boolean>;
  disabled: Accessor<boolean>;
  orientation: Accessor<"horizontal" | "vertical">;
  spacing: Accessor<number>;
  variant: Accessor<"default" | "outline">;
  size: Accessor<"default" | "sm" | "lg">;
}
