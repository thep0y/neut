import { splitProps } from "solid-js";
import type { SliderThumbProps } from "./SliderThumb.types";
import { clsx } from "~/utils";
import { classes } from "./SliderThumb.styles";
import { useSliderThumb } from "./useSliderThumb";
import { useSliderContext } from "../Slider";

export const SliderThumb = (props: SliderThumbProps) => {
  const ctx = useSliderContext();

  const [local, others] = splitProps(props, ["index", "class", "classList"]);

  const { positionStyle, handleKeyDown, value } = useSliderThumb(local.index);

  return (
    <div
      data-slot="slider-thumb"
      data-index={local.index}
      data-orientation={ctx.orientation()}
      data-disabled={ctx.disabled()}
      // 滑块语义：屏幕阅读器要能读出当前值与范围（对齐 Base UI / Radix 的 ARIA）
      role="slider"
      aria-valuemin={ctx.min()}
      aria-valuemax={ctx.max()}
      aria-valuenow={value()}
      aria-orientation={ctx.orientation()}
      aria-disabled={ctx.disabled()}
      // role="slider" 是可交互角色，必须可聚焦（biome 的 useFocusableInteractive）
      tabIndex={ctx.disabled() ? -1 : 0}
      class={clsx(classes, local.class)}
      classList={local.classList}
      style={positionStyle()}
      onKeyDown={handleKeyDown}
      onFocus={() => ctx.setActiveThumbIndex(local.index)}
      {...others}
    />
  );
};
