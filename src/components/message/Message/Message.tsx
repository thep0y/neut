import { mergeProps, splitProps } from "solid-js";
import { clsx } from "~/utils";
import type { MessageProps } from "./Message.types";

/** 单条消息的行布局：负责头像、对齐、header、footer 的排布 */
export function Message(props: MessageProps) {
  const merged = mergeProps({ align: "start" } as const, props);
  const [local, rest] = splitProps(merged, ["align", "class", "classList"]);

  return (
    <div
      {...rest}
      data-slot="message"
      data-align={local.align}
      class={clsx(
        "group/message relative flex w-full min-w-0 gap-2 text-sm data-[align=end]:flex-row-reverse",
        local.class,
      )}
      classList={local.classList}
    />
  );
}
