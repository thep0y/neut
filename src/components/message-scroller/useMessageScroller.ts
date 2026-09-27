import { useMessageScrollerContext } from "./message-scroller.context";

/** 在 Provider 内部任意位置驱动滚动（含 MessageScroller 框架之外的自定义控件） */
export function useMessageScroller() {
  const ctx = useMessageScrollerContext("useMessageScroller");
  return {
    scrollToStart: ctx.scrollToStart,
    scrollToEnd: ctx.scrollToEnd,
    scrollToMessage: ctx.scrollToMessage,
  };
}
