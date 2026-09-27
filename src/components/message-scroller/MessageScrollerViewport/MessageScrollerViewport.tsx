import { createEffect, onCleanup, splitProps } from "solid-js";
import { clsx, mergeRefs } from "~/utils";
import { useMessageScrollerContext } from "../message-scroller.context";
import { scrollableData } from "../message-scroller.utils";
import type { MessageScrollerViewportProps } from "../message-scroller.types";

/**
 * 可滚动元素：接收原生 scroll，维护可滚动状态；上方插入历史时保持可见行。
 * 默认是键盘可达的、有标签的滚动区域。转发 `ref` 便于外部（如虚拟化）拿到滚动元素。
 */
export function MessageScrollerViewport(props: MessageScrollerViewportProps) {
  const ctx = useMessageScrollerContext("MessageScrollerViewport");
  const [local, rest] = splitProps(props, [
    "class",
    "classList",
    "aria-label",
    "preserveScrollOnPrepend",
    "ref",
    "role",
    "tabIndex",
  ]);

  createEffect(() =>
    ctx.setPreserveScrollOnPrepend(local.preserveScrollOnPrepend ?? true),
  );

  return (
    // biome-ignore lint/a11y/useAriaPropsSupportedByRole: role 允许被调用方覆盖(对齐上游),静态分析无法确定
    <div
      {...rest}
      ref={mergeRefs(
        (el) => {
          ctx.setViewport(el as HTMLElement);
          onCleanup(() => ctx.setViewport(undefined));
        },
        local.ref as ((el: Element) => void) | undefined,
      )}
      data-slot="message-scroller-viewport"
      role={local.role ?? "region"}
      aria-label={local["aria-label"] ?? "Messages"}
      tabindex={local.tabIndex ?? 0}
      data-scrollable={scrollableData(ctx.scrollableStart, ctx.scrollableEnd)}
      data-pending-scroll={ctx.pendingScroll() ? "" : undefined}
      data-autoscrolling={ctx.autoscrolling() ? "" : undefined}
      class={clsx(
        "size-full min-h-0 min-w-0 scroll-fade-b scrollbar-thin [scrollbar-gutter:stable] overflow-y-auto overscroll-contain contain-content outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        "data-autoscrolling:scrollbar-thumb-transparent data-autoscrolling:scrollbar-track-transparent",
        "data-pending-scroll:invisible",
        local.class,
      )}
      classList={local.classList}
    />
  );
}
