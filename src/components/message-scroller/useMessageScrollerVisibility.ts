import { onCleanup, onMount } from "solid-js";
import { useMessageScrollerContext } from "./message-scroller.context";
import type { MessageScrollerVisibilityValue } from "./message-scroller.types";

/**
 * 跟踪读者在会话中的位置：`currentAnchorId` 是当前锚定的回合，
 * `visibleMessageIds` 是屏幕上可见的消息（文档顺序）。
 * 仅在有订阅者时才计算（pay-for-what-you-use）。
 */
export function useMessageScrollerVisibility(): MessageScrollerVisibilityValue {
  const ctx = useMessageScrollerContext("useMessageScrollerVisibility");

  onMount(() => {
    const unsubscribe = ctx.subscribeVisibility();
    onCleanup(unsubscribe);
  });

  return {
    currentAnchorId: ctx.currentAnchorId,
    visibleMessageIds: ctx.visibleMessageIds,
  };
}
