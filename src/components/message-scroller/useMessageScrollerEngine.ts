import { createEffect, createSignal, onCleanup } from "solid-js";
import type {
  MessageScrollerContextValue,
  MessageScrollerItemEntry,
  MessageScrollerProviderProps,
} from "./message-scroller.types";

const BOTTOM_THRESHOLD = 2;

/**
 * MessageScroller 的滚动引擎（headless）。把「滚动位置」保持在信号/属性里、
 * 而非每条消息的渲染上：
 * - 可滚动状态（能否向上/向下）由 scroll + ResizeObserver 维护；
 * - `autoScroll`：仅在读者位于实时边缘时跟随内容增长，用户滚动离开即让位；
 * - `defaultScrollPosition`：首次挂载后定位到 start / end / last-anchor；
 * - `preserveScrollOnPrepend`：上方插入历史时按高度差补偿 scrollTop。
 *
 * 说明：本期未实现 `useMessageScrollerVisibility`（可见性订阅）与「新回合实时锚定」，
 * 详见 DESIGN.md「后续待实现」。
 */
export function useMessageScrollerEngine(
  options: () => Required<Omit<MessageScrollerProviderProps, "children">>,
): MessageScrollerContextValue {
  const [viewport, setViewport] = createSignal<HTMLElement>();
  const [content, setContent] = createSignal<HTMLElement>();
  const [scrollableStart, setScrollableStart] = createSignal(false);
  const [scrollableEnd, setScrollableEnd] = createSignal(false);
  const [autoscrolling, setAutoscrolling] = createSignal(false);
  const [pendingScroll, setPendingScroll] = createSignal(
    options().defaultScrollPosition !== "start",
  );
  const [itemsVersion, setItemsVersion] = createSignal(0);

  const items = new Map<symbol, MessageScrollerItemEntry>();
  let following = false;
  let didInitial = false;
  let lastScrollHeight = 0;
  let scrollingProgrammatically = false;

  const updateScrollable = () => {
    const el = viewport();
    if (!el) return;
    const atStart = el.scrollTop <= 1;
    const atEnd =
      el.scrollTop + el.clientHeight >= el.scrollHeight - BOTTOM_THRESHOLD;
    setScrollableStart(!atStart);
    setScrollableEnd(!atEnd);
    following = atEnd;
  };

  const setScrollTop = (top: number, autoscroll = false) => {
    const el = viewport();
    if (!el) return;
    scrollingProgrammatically = true;
    if (autoscroll) setAutoscrolling(true);
    el.scrollTop = top;
    requestAnimationFrame(() => {
      scrollingProgrammatically = false;
      if (autoscroll) setAutoscrolling(false);
      updateScrollable();
    });
  };

  const scrollToEnd = () => {
    const el = viewport();
    if (!el) return;
    following = true;
    setScrollTop(el.scrollHeight, true);
  };

  const scrollToStart = () => {
    setScrollTop(0);
  };

  const scrollToMessage = (id: string) => {
    const el = viewport();
    if (!el) return false;
    for (const entry of items.values()) {
      if (entry.id === id) {
        const peek = options().scrollPreviousItemPeek;
        setScrollTop(Math.max(0, entry.element.offsetTop - peek));
        return true;
      }
    }
    return false;
  };

  const registerItem = (entry: MessageScrollerItemEntry) => {
    const key = Symbol();
    items.set(key, entry);
    setItemsVersion((v) => v + 1);
    return () => {
      items.delete(key);
      setItemsVersion((v) => v + 1);
    };
  };

  const applyInitialPosition = () => {
    const el = viewport();
    if (!el || didInitial || items.size === 0) return;
    didInitial = true;
    const pos = options().defaultScrollPosition;
    if (pos === "start") {
      el.scrollTop = 0;
    } else if (pos === "end") {
      el.scrollTop = el.scrollHeight;
    } else {
      const anchors = [...items.values()].filter((i) => i.anchor());
      const last = anchors[anchors.length - 1];
      if (last) {
        el.scrollTop = Math.max(
          0,
          last.element.offsetTop - options().scrollPreviousItemPeek,
        );
      } else {
        el.scrollTop = el.scrollHeight;
      }
    }
    lastScrollHeight = el.scrollHeight;
    updateScrollable();
    setPendingScroll(false);
  };

  // 视口挂载后：绑定 scroll/尺寸监听 + 观察内容变化
  createEffect(() => {
    const el = viewport();
    if (!el) return;

    const onScroll = () => {
      if (scrollingProgrammatically) return;
      updateScrollable();
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    const resize = new ResizeObserver(() => {
      updateScrollable();
      if (options().autoScroll && following && didInitial) scrollToEnd();
    });
    resize.observe(el);

    onCleanup(() => {
      el.removeEventListener("scroll", onScroll);
      resize.disconnect();
    });
  });

  // 内容变化：初次定位 / prepend 保位 / autoScroll 跟随
  createEffect(() => {
    const el = content();
    if (!el) return;

    const observer = new MutationObserver((records) => {
      const viewportEl = viewport();
      if (viewportEl) {
        const prepended =
          options().preserveScrollOnPrepend &&
          viewportEl.scrollTop > 0 &&
          records.some(
            (r) => r.addedNodes.length > 0 && r.previousSibling === null,
          );
        if (prepended) {
          const delta = viewportEl.scrollHeight - lastScrollHeight;
          if (delta > 0) viewportEl.scrollTop += delta;
        }
        lastScrollHeight = viewportEl.scrollHeight;
      }
      if (!didInitial) applyInitialPosition();
      else if (options().autoScroll && following) scrollToEnd();
    });
    observer.observe(el, { childList: true, subtree: true });

    const resize = new ResizeObserver(() => {
      if (!didInitial) applyInitialPosition();
      else if (options().autoScroll && following) scrollToEnd();
    });
    resize.observe(el);

    onCleanup(() => {
      observer.disconnect();
      resize.disconnect();
    });
  });

  // 内容里已有条目时也尝试初次定位（条目是 ref 注册的，可能晚于 content）
  createEffect(() => {
    content();
    itemsVersion();
    applyInitialPosition();
  });

  return {
    viewport,
    setViewport,
    content,
    setContent,
    registerItem,
    scrollableStart,
    scrollableEnd,
    autoscrolling,
    pendingScroll,
    scrollToStart,
    scrollToEnd,
    scrollToMessage,
    options,
  };
}
