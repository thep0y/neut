import { useMessageScrollerContext } from "./message-scroller.context";

/** 读取视口还能向哪个方向滚动（"在起点/终点" 取其反） */
export function useMessageScrollerScrollable() {
  const ctx = useMessageScrollerContext("useMessageScrollerScrollable");
  return { start: ctx.scrollableStart, end: ctx.scrollableEnd };
}
