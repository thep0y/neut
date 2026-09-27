import { Show, createEffect, mergeProps, splitProps } from "solid-js";
import { ArrowDown } from "lucide-solid";
import { clsx } from "~/utils";
import { useMessageScrollerContext } from "../message-scroller.context";
import type { MessageScrollerButtonProps } from "../message-scroller.types";

/**
 * 滚动控件：滚到会话的开始/结束；该方向没有内容时置为 inert 并移出 tab 序列。
 * 默认渲染箭头图标，传入 children 可自定义内容（如 "Jump to latest"）。
 */
export function MessageScrollerButton(props: MessageScrollerButtonProps) {
  const ctx = useMessageScrollerContext("MessageScrollerButton");
  const merged = mergeProps(
    {
      direction: "end" as const,
      behavior: "smooth" as ScrollBehavior,
      variant: "secondary",
      size: "xs",
    },
    props,
  );
  const [local, rest] = splitProps(merged, [
    "class",
    "classList",
    "direction",
    "behavior",
    "variant",
    "size",
    "children",
  ]);

  const active = () =>
    local.direction === "end" ? ctx.scrollableEnd() : ctx.scrollableStart();

  return (
    <button
      {...rest}
      ref={(el) => {
        createEffect(() => {
          el.inert = !active();
        });
      }}
      type="button"
      data-slot="message-scroller-button"
      data-direction={local.direction}
      data-variant={local.variant}
      data-size={local.size}
      data-active={active() ? "true" : "false"}
      tabIndex={active() ? 0 : -1}
      aria-label={
        local.direction === "end" ? "Scroll to end" : "Scroll to start"
      }
      onClick={() =>
        local.direction === "end"
          ? ctx.scrollToEnd({ behavior: local.behavior })
          : ctx.scrollToStart({ behavior: local.behavior })
      }
      class={clsx(
        "absolute left-1/2 z-10 inline-flex size-8 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md transition-[translate,scale,opacity] duration-200 hover:bg-muted",
        "data-[direction=end]:bottom-4 data-[direction=start]:top-4",
        "data-[active=true]:scale-100 data-[active=true]:opacity-100",
        "data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0",
        local.class,
      )}
      classList={local.classList}
    >
      <Show
        when={local.children}
        fallback={
          <ArrowDown
            class={clsx("size-4", local.direction === "start" && "rotate-180")}
          />
        }
      >
        {(children) => children()}
      </Show>
    </button>
  );
}
