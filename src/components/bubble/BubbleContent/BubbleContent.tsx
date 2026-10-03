import { splitProps, type ValidComponent } from "solid-js";
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
) => {
  // class / classList 必须显式摘出来并一起传给 Dynamic：
  // `{...props}` 之后再写显式 `class=` 会用 node.className 覆盖掉 classList
  const [local, others] = splitProps(props as BubbleContentProps, [
    "component",
    "class",
    "classList",
  ]);

  return (
    <Dynamic
      {...others}
      component={(local.component as ValidComponent) ?? "div"}
      data-slot="bubble-content"
      class={clsx(bubbleContentClasses, local.class)}
      classList={local.classList}
    />
  );
};
