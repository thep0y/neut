import { splitProps } from "solid-js";
import { clsx } from "~/utils";
import { useMessageScrollerContext } from "../message-scroller.context";
import type { MessageScrollerProps } from "../message-scroller.types";

/** 有样式的框架：在 Provider 内布局 viewport / content / 控件 */
export function MessageScroller(props: MessageScrollerProps) {
  const ctx = useMessageScrollerContext("MessageScroller");
  const [local, rest] = splitProps(props, ["class", "classList"]);

  return (
    <div
      {...rest}
      data-slot="message-scroller"
      data-scrollable={
        ctx.scrollableStart() || ctx.scrollableEnd() ? "" : undefined
      }
      class={clsx(
        "group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden",
        local.class,
      )}
      classList={local.classList}
    />
  );
}
