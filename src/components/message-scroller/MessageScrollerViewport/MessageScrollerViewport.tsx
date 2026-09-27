import { onCleanup, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { useMessageScrollerContext } from "../message-scroller.context";
import type { MessageScrollerViewportProps } from "../message-scroller.types";

/**
 * 可滚动元素：接收原生 scroll，维护可滚动状态；上方插入历史时保持可见行。
 * 默认是键盘可达的、有标签的滚动区域。
 */
export function MessageScrollerViewport(props: MessageScrollerViewportProps) {
  const ctx = useMessageScrollerContext("MessageScrollerViewport");
  const [local, rest] = splitProps(props, ["class", "classList", "aria-label"]);

  return (
    <div
      {...rest}
      ref={(el) => {
        ctx.setViewport(el);
        onCleanup(() => ctx.setViewport(undefined));
      }}
      data-slot="message-scroller-viewport"
      role="region"
      aria-label={local["aria-label"] ?? "Messages"}
      tabindex={0}
      data-pending-scroll={ctx.pendingScroll() ? "" : undefined}
      data-autoscrolling={ctx.autoscrolling() ? "" : undefined}
      class={clsx(
        "size-full min-h-0 min-w-0 scroll-fade-b scrollbar-thin [scrollbar-gutter:stable] overflow-y-auto overscroll-contain contain-content outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        "data-pending-scroll:invisible",
        local.class,
      )}
      classList={local.classList}
    />
  );
}
