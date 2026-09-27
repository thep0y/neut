import type { ValidComponent } from "solid-js";
import { Dynamic } from "solid-js/web";
import { clsx } from "~/utils";
import { bubbleContentClasses } from "./BubbleContent.styles";
import type { BubbleContentProps } from "./BubbleContent.types";

/**
 * 气泡内容，默认渲染 div，可用 `component` 换成 button / a 等交互元素
 * （变体样式通过 `[button,a]` 变体命中，并自带 focus ring）。
 */
export const BubbleContent = <T extends ValidComponent = "div">(
  props: BubbleContentProps<T>,
) => (
  <Dynamic
    {...props}
    component={(props.component as ValidComponent) ?? "div"}
    data-slot="bubble-content"
    class={clsx(bubbleContentClasses, props.class)}
  />
);
