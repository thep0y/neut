import { onCleanup, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { useMessageScrollerContext } from "../message-scroller.context";
import type { MessageScrollerContentProps } from "../message-scroller.types";

/**
 * 会话容器：承载各行，并作为新消息的 live region。
 * 末尾的内部 spacer 由引擎按需设置高度，让靠近结尾的锚定行也能滚到顶部。
 */
export function MessageScrollerContent(props: MessageScrollerContentProps) {
  const ctx = useMessageScrollerContext("MessageScrollerContent");
  const [local, rest] = splitProps(props, [
    "class",
    "classList",
    "aria-busy",
    "spacerClassName",
    "role",
    "aria-relevant",
    "children",
  ]);

  return (
    <div
      {...rest}
      ref={(el) => {
        ctx.setContent(el);
        onCleanup(() => ctx.setContent(undefined));
      }}
      data-slot="message-scroller-content"
      role={local.role ?? "log"}
      aria-relevant={local["aria-relevant"] ?? "additions"}
      aria-busy={local["aria-busy"]}
      class={clsx("flex h-max min-h-full flex-col", local.class)}
      classList={local.classList}
    >
      {local.children}
      <div
        ref={(el) => {
          ctx.setSpacer(el);
          onCleanup(() => ctx.setSpacer(undefined));
        }}
        aria-hidden="true"
        data-message-scroller-spacer=""
        hidden
        class={local.spacerClassName}
      />
    </div>
  );
}
