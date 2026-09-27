import { createEffect, createSignal, onCleanup } from "solid-js";
import type {
  MessageScrollerCommandOptions,
  MessageScrollerContextValue,
  MessageScrollerItemEntry,
  MessageScrollerProviderProps,
} from "./message-scroller.types";

const AT_EDGE_TOLERANCE = 1;
const SETTLE_FALLBACK_MS = 600;

/**
 * MessageScroller 的滚动引擎（headless）。把「滚动位置」保持在信号/属性里、
 * 而非每条消息的渲染上：
 * - 可滚动状态（能否向上/向下）由 scroll + ResizeObserver 维护；
 * - `autoScroll`：仅在读者位于实时边缘时跟随内容增长，用户滚动离开即让位；
 * - **新回合锚定**：带 `scrollAnchor` 的新行追加且读者在实时边缘时，把它放到靠近顶部
 *   并保留 `scrollPreviousItemPeek` 的上下文；此后回复在下方生长，直到内容填满视口，
 *   读者重新回到实时边缘、`autoScroll` 接管；
 * - `defaultScrollPosition`：首次挂载后定位到 start / end / last-anchor，应用前用
 *   `data-pending-scroll` 隐藏视口以避免跳动；空会话不设置该属性；
 * - `preserveScrollOnPrepend`：上方插入历史时按高度差补偿 scrollTop；
 * - **可见性**：仅在有人订阅 `useMessageScrollerVisibility` 时计算。
 */
export function useMessageScrollerEngine(
  options: () => Required<Omit<MessageScrollerProviderProps, "children">>,
): MessageScrollerContextValue {
  const [viewport, setViewport] = createSignal<HTMLElement>();
  const [content, setContent] = createSignal<HTMLElement>();
  const [preserveScrollOnPrepend, setPreserveScrollOnPrepend] =
    createSignal(true);
  const [scrollableStart, setScrollableStart] = createSignal(false);
  const [scrollableEnd, setScrollableEnd] = createSignal(false);
  const [autoscrolling, setAutoscrolling] = createSignal(false);
  const [pendingScroll, setPendingScroll] = createSignal(
    options().defaultScrollPosition !== "start",
  );
  const [currentAnchorId, setCurrentAnchorId] = createSignal<string | null>(
    null,
  );
  const [visibleMessageIds, setVisibleMessageIds] = createSignal<string[]>([]);
  const [itemsVersion, setItemsVersion] = createSignal(0);

  const items = new Map<symbol, MessageScrollerItemEntry>();
  let following = false;
  let didInitial = false;
  let lastScrollHeight = 0;
  let scrollingProgrammatically = false;
  let visibilitySubscribers = 0;
  let pendingMessageId: string | undefined;

  const orderedItems = () => [...items.values()];

  /**
   * 行相对滚动容器内容顶部的偏移。用测量而非 `offsetTop`：Viewport 不一定是
   * `position: relative`，`offsetTop` 可能相对更上层的定位祖先而算错。
   */
  const itemOffsetTop = (element: HTMLElement) => {
    const el = viewport();
    if (!el) return element.offsetTop;
    return (
      element.getBoundingClientRect().top -
      el.getBoundingClientRect().top +
      el.scrollTop
    );
  };

  const computeVisibility = () => {
    if (visibilitySubscribers === 0) return;
    const vp = viewport();
    if (!vp) return;
    const vpRect = vp.getBoundingClientRect();
    // 阅读行 = 视口顶部 + scrollMargin；落在其上或已滚过的最后一个锚点即当前回合
    const readingLine = vpRect.top + options().scrollMargin + AT_EDGE_TOLERANCE;
    const visible: string[] = [];
    let anchorId: string | null = null;
    for (const entry of orderedItems()) {
      if (!entry.id) continue;
      const rect = entry.element.getBoundingClientRect();
      if (rect.bottom > vpRect.top && rect.top < vpRect.bottom) {
        visible.push(entry.id);
      }
      if (entry.anchor() && rect.top <= readingLine) {
        anchorId = entry.id;
      }
    }
    setVisibleMessageIds(visible);
    setCurrentAnchorId(anchorId);
  };

  const updateScrollable = () => {
    const el = viewport();
    if (!el) return;
    const threshold = options().scrollEdgeThreshold;
    const atStart = el.scrollTop <= threshold;
    const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
    setScrollableStart(!atStart);
    setScrollableEnd(!atEnd);
    following = atEnd;
    computeVisibility();
  };

  /**
   * 程序化滚动。平滑滚动期间不能让用户滚动事件误判为「读者离开了实时边缘」，
   * 因此用 scrollend（带超时兜底）而不是下一帧来恢复状态跟踪。
   */
  const setScrollTop = (
    top: number,
    {
      behavior = "auto",
      autoscroll = false,
    }: {
      behavior?: ScrollBehavior;
      autoscroll?: boolean;
    } = {},
  ) => {
    const el = viewport();
    if (!el) return;
    scrollingProgrammatically = true;
    if (autoscroll) setAutoscrolling(true);
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      scrollingProgrammatically = false;
      if (autoscroll) setAutoscrolling(false);
      updateScrollable();
    };
    if (behavior === "smooth") {
      el.scrollTo({ top, behavior: "smooth" });
      el.addEventListener("scrollend", settle, { once: true });
      window.setTimeout(settle, SETTLE_FALLBACK_MS);
    } else {
      el.scrollTop = top;
      requestAnimationFrame(settle);
    }
  };

  const clamp = (top: number) => {
    const el = viewport();
    if (!el) return top;
    return Math.max(0, Math.min(top, el.scrollHeight - el.clientHeight));
  };

  const scrollToEnd = (command?: MessageScrollerCommandOptions) => {
    const el = viewport();
    if (!el) return false;
    following = true;
    setScrollTop(el.scrollHeight, {
      behavior: command?.behavior ?? "auto",
      autoscroll: true,
    });
    return true;
  };

  const scrollToStart = (command?: MessageScrollerCommandOptions) => {
    if (!viewport()) return false;
    setScrollTop(0, { behavior: command?.behavior ?? "auto" });
    return true;
  };

  const targetTop = (
    entry: MessageScrollerItemEntry,
    command?: MessageScrollerCommandOptions,
  ) => {
    const el = viewport();
    if (!el) return 0;
    const margin = command?.scrollMargin ?? options().scrollMargin;
    const itemTop = itemOffsetTop(entry.element);
    const itemHeight = entry.element.getBoundingClientRect().height;
    switch (command?.align ?? "start") {
      case "center":
        return clamp(itemTop - (el.clientHeight - itemHeight) / 2 - margin);
      case "end":
        return clamp(itemTop + itemHeight - el.clientHeight + margin);
      case "nearest": {
        const current = el.scrollTop;
        const fullyVisible =
          itemTop - margin >= current &&
          itemTop + itemHeight + margin <= current + el.clientHeight;
        return fullyVisible ? current : clamp(itemTop - margin);
      }
      default:
        return clamp(itemTop - margin);
    }
  };

  const scrollToMessage = (
    messageId: string,
    command?: MessageScrollerCommandOptions,
  ) => {
    if (!viewport()) return false;
    for (const entry of orderedItems()) {
      if (entry.id === messageId) {
        setScrollTop(targetTop(entry, command), {
          behavior: command?.behavior ?? "auto",
        });
        return true;
      }
    }
    // 会话尚未挂载任何行时排队，覆盖「客户端解析永久链接时内容还在挂载」的场景；
    // 已挂载但 id 不存在则返回 false，避免无意义的重试循环。
    if (items.size === 0) {
      pendingMessageId = messageId;
      return true;
    }
    return false;
  };

  /** 新回合锚定：仅当追加的是最新的那行、且读者原本在实时边缘 */
  const maybeAnchorNewTurn = (entry: MessageScrollerItemEntry) => {
    if (!didInitial) return;
    if (!entry.anchor() || !following) return;
    const list = orderedItems();
    if (list[list.length - 1]?.element !== entry.element) return;
    following = false;
    queueMicrotask(() => {
      if (!entry.element.isConnected) return;
      const peek = options().scrollPreviousItemPeek;
      setScrollTop(clamp(itemOffsetTop(entry.element) - peek), {
        autoscroll: true,
      });
    });
  };

  const registerItem = (entry: MessageScrollerItemEntry) => {
    const key = Symbol();
    items.set(key, entry);
    setItemsVersion((v) => v + 1);
    maybeAnchorNewTurn(entry);
    // 排队的跳转目标挂载后补一次（等布局完成再量位置）
    if (pendingMessageId && entry.id === pendingMessageId) {
      const target = pendingMessageId;
      pendingMessageId = undefined;
      requestAnimationFrame(() => scrollToMessage(target));
    }
    computeVisibility();
    return () => {
      items.delete(key);
      setItemsVersion((v) => v + 1);
      computeVisibility();
    };
  };

  const subscribeVisibility = () => {
    visibilitySubscribers += 1;
    if (visibilitySubscribers === 1) computeVisibility();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      visibilitySubscribers -= 1;
      if (visibilitySubscribers === 0) {
        setVisibleMessageIds([]);
        setCurrentAnchorId(null);
      }
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
      // "last-anchor"：定位到最后一个 scrollAnchor；无锚点或该回合放得下时回退到 end
      const anchors = orderedItems().filter((i) => i.anchor());
      const last = anchors[anchors.length - 1];
      const maxTop = el.scrollHeight - el.clientHeight;
      const peek = options().scrollPreviousItemPeek;
      const anchorTop = last
        ? itemOffsetTop(last.element) - peek
        : Number.POSITIVE_INFINITY;
      el.scrollTop =
        last && anchorTop > 0 && anchorTop <= maxTop
          ? anchorTop
          : el.scrollHeight;
    }
    lastScrollHeight = el.scrollHeight;
    updateScrollable();
    setPendingScroll(false);
  };

  // 视口挂载后：绑定 scroll/尺寸监听
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

  // 内容变化：初次定位 / prepend 保位 / autoScroll 跟随 / 可见性
  createEffect(() => {
    const el = content();
    if (!el) return;

    const observer = new MutationObserver((records) => {
      const viewportEl = viewport();
      if (viewportEl) {
        const prepended =
          preserveScrollOnPrepend() &&
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
      computeVisibility();
    });
    observer.observe(el, { childList: true, subtree: true });

    const resize = new ResizeObserver(() => {
      if (!didInitial) applyInitialPosition();
      else if (options().autoScroll && following) scrollToEnd();
      computeVisibility();
    });
    resize.observe(el);

    onCleanup(() => {
      observer.disconnect();
      resize.disconnect();
    });
  });

  // 内容里的条目变化：空会话不设置 data-pending-scroll，其余触发初次定位
  createEffect(() => {
    content();
    itemsVersion();
    if (items.size === 0) {
      setPendingScroll(false);
      return;
    }
    applyInitialPosition();
  });

  return {
    viewport,
    setViewport,
    content,
    setContent,
    registerItem,
    preserveScrollOnPrepend,
    setPreserveScrollOnPrepend,
    scrollableStart,
    scrollableEnd,
    autoscrolling,
    pendingScroll,
    scrollToStart,
    scrollToEnd,
    scrollToMessage,
    currentAnchorId,
    visibleMessageIds,
    subscribeVisibility,
    options,
  };
}
