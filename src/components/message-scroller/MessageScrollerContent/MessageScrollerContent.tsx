import { onCleanup, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { useMessageScrollerContext } from "../message-scroller.context";
import type { MessageScrollerContentProps } from "../message-scroller.types";

/** 会话容器：承载各行，并作为新消息的 live region */
export function MessageScrollerContent(props: MessageScrollerContentProps) {
  const ctx = useMessageScrollerContext("MessageScrollerContent");
  const [local, rest] = splitProps(props, ["class", "classList", "aria-busy"]);

  return (
    <div
      {...rest}
      ref={(el) => {
        ctx.setContent(el);
        onCleanup(() => ctx.setContent(undefined));
      }}
      data-slot="message-scroller-content"
      role="log"
      aria-relevant="additions"
      aria-busy={local["aria-busy"]}
      class={clsx("flex h-max min-h-full flex-col gap-6", local.class)}
      classList={local.classList}
    />
  );
}
