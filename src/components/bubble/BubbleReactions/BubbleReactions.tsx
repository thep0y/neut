import { mergeProps, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { bubbleReactionsVariants } from "./BubbleReactions.styles";
import type { BubbleReactionsProps } from "./BubbleReactions.types";

/**
 * 贴在气泡边缘的回复/反应行。展示型 emoji 建议加 `role="img"` + `aria-label`，
 * 交互型则渲染 Button 并给纯图标按钮 aria-label。
 */
export function BubbleReactions(props: BubbleReactionsProps) {
  const merged = mergeProps({ side: "bottom", align: "end" } as const, props);
  const [local, rest] = splitProps(merged, [
    "side",
    "align",
    "class",
    "classList",
  ]);

  return (
    <div
      {...rest}
      data-slot="bubble-reactions"
      data-align={local.align}
      data-side={local.side}
      class={clsx(
        bubbleReactionsVariants({ side: local.side, align: local.align }),
        local.class,
      )}
      classList={local.classList}
    />
  );
}
