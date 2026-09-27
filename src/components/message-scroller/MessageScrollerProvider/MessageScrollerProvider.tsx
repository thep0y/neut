import { mergeProps, splitProps, type JSX } from "solid-js";
import { MessageScrollerContext } from "../message-scroller.context";
import { useMessageScrollerEngine } from "../useMessageScrollerEngine";
import type { MessageScrollerProviderProps } from "../message-scroller.types";

/** 滚动状态机根：不渲染 DOM，提供 context 与滚动行为 */
export function MessageScrollerProvider(
  props: MessageScrollerProviderProps,
): JSX.Element {
  const merged = mergeProps(
    {
      autoScroll: false,
      defaultScrollPosition: "end" as const,
      scrollPreviousItemPeek: 0,
      preserveScrollOnPrepend: true,
    },
    props,
  );
  const [local] = splitProps(merged, [
    "autoScroll",
    "defaultScrollPosition",
    "scrollPreviousItemPeek",
    "preserveScrollOnPrepend",
    "children",
  ]);

  const ctx = useMessageScrollerEngine(() => ({
    autoScroll: local.autoScroll,
    defaultScrollPosition: local.defaultScrollPosition,
    scrollPreviousItemPeek: local.scrollPreviousItemPeek,
    preserveScrollOnPrepend: local.preserveScrollOnPrepend,
  }));

  return (
    <MessageScrollerContext.Provider value={ctx}>
      {local.children}
    </MessageScrollerContext.Provider>
  );
}
