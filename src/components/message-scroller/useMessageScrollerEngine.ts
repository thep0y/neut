import { createEffect, createSignal, onCleanup } from "solid-js";
import type {
  MessageScrollerContextValue,
  MessageScrollerItemEntry,
  MessageScrollerProviderProps,
  MessageScrollerScrollOptions,
} from "./message-scroller.types";
import {
  firstAnchorFrom,
  firstUnhandledAnchor,
  hasMultipleAnchorsFrom,
} from "./message-scroller.anchors";
import { createDomMeasure } from "./message-scroller.dom-measure";
import { createScrollCommands } from "./message-scroller.commands";
import { createScrollState } from "./message-scroller.scroll-state";
import { createVisibility } from "./message-scroller.visibility";
import { AT_EDGE_TOLERANCE } from "./message-scroller.utils";

/** 会让界面「让位」的键盘滚动键 */
const NAV_KEYS = new Set([
  "ArrowDown",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
  " ",
]);

/**
 * MessageScroller 的滚动引擎（headless，行为对齐 `@shadcn/react`）：
 * - 滚动状态（能否向上/下）由 content 的**非 spacer** 内容底部计算，spacer 不计入；
 * - `autoScroll` 只在模式为 `following-bottom` 时跟随；滚轮/触摸/键盘滚动与显式跳转
 *   都会立刻让位（`free-scrolling`）；
 * - 新回合锚定：新增 scrollAnchor 行时用 `scrollToElement(keepPreviousPeek)` 将其放到
 *   顶部并保留上一项；同时把该行记为 `streamingTurn`，回复生长时原地重锚定；
 * - `scrollToElement` 会按需设置尾部 spacer，让目标行即使靠近会话末尾也能滚到顶部；
 * - `defaultScrollPosition`：首次非空渲染定位一次；`last-anchor` 无锚点或放得下时回退 end；
 * - `preserveScrollOnPrepend`：记录首个可见行及其视口位置，上方插入历史后按差值补偿；
 * - 可见性：IntersectionObserver 按需订阅（rootMargin 用 scrollMargin + peek），无 IO 时退化为
 *   逐帧测量；`currentAnchorId` 是阅读行之上最后一个锚点。
 */
export function useMessageScrollerEngine(
  options: () => Required<Omit<MessageScrollerProviderProps, "children">>,
): MessageScrollerContextValue {
  const [viewport, setViewport] = createSignal<HTMLElement>();
  const [content, setContent] = createSignal<HTMLElement>();
  const [spacer, setSpacerSignal] = createSignal<HTMLElement>();
  const [preserveScrollOnPrepend, setPreserveScrollOnPrepend] =
    createSignal(true);
  const [pendingScroll, setPendingScroll] = createSignal(
    options().defaultScrollPosition !== "start",
  );

  const messageElements = new Map<string, HTMLElement>();
  const handledScrollAnchors = new WeakSet<HTMLElement>();

  let itemCount = 0;
  let firstItem: HTMLElement | null = null;
  let defaultApplied = false;
  let streamingTurn: HTMLElement | null = null;
  let pendingMessage: {
    id: string;
    options?: MessageScrollerScrollOptions;
  } | null = null;
  let prependAnchor: { element: HTMLElement; viewportTop: number } | null =
    null;
  let pendingFrame: number | null = null;

  const measure = createDomMeasure({ viewport, content, spacer });
  const { items, itemOffsetTop, itemTopInViewport, contentBottom } = measure;

  const visibility = createVisibility({
    viewport,
    content,
    items,
    options,
    registeredElements: () => messageElements.values(),
  });
  const {
    currentAnchorId,
    visibleMessageIds,
    schedule: scheduleVisibilitySync,
  } = visibility;

  const scrollState = createScrollState({ viewport, options, contentBottom });
  const {
    scrollableStart,
    scrollableEnd,
    autoscrolling,
    commit: commitScrollState,
    schedule: scheduleStateCommit,
    releaseFollow,
  } = scrollState;

  const commands = createScrollCommands({
    viewport,
    content,
    spacer,
    options,
    measure,
    state: scrollState,
    scheduleVisibility: scheduleVisibilitySync,
  });
  const {
    setSpacerElement,
    scrollToStart: runScrollToStart,
    scrollToEnd: runScrollToEnd,
    scrollToElement: runScrollToElement,
  } = commands;

  const scrollToStart = (command?: MessageScrollerScrollOptions) => {
    streamingTurn = null;
    return runScrollToStart(command);
  };

  const scrollToEnd = (command?: MessageScrollerScrollOptions) => {
    streamingTurn = null;
    return runScrollToEnd(command);
  };

  const scrollToElement = (
    element: HTMLElement,
    command?: MessageScrollerScrollOptions,
    { keepPreviousPeek = false }: { keepPreviousPeek?: boolean } = {},
  ) => {
    const ok = runScrollToElement(element, command, { keepPreviousPeek });
    if (!ok) return false;
    prependAnchor = { element, viewportTop: itemTopInViewport(element) };
    streamingTurn = keepPreviousPeek ? element : null;
    return true;
  };

  const reanchorToAnchoredMessage = () => {
    const el = streamingTurn;
    if (!el?.isConnected || !scrollState.isAnchored()) return false;
    return scrollToElement(el, { align: "start" }, { keepPreviousPeek: true });
  };

  const applyDefaultScrollPosition = () => {
    const vp = viewport();
    if (!vp || defaultApplied || itemCount === 0) return false;
    const position = options().defaultScrollPosition;
    let applied = false;
    if (position === "last-anchor") {
      const list = items();
      const lastAnchor =
        [...list].reverse().find((el) => el.dataset.scrollAnchor === "true") ??
        null;
      if (!lastAnchor) {
        applied = scrollToEnd({ behavior: "auto" });
      } else if (
        contentBottom() - itemOffsetTop(lastAnchor) <=
        vp.clientHeight
      ) {
        // 该回合完全放得下 → 直接到底
        applied = scrollToEnd({ behavior: "auto" });
      } else {
        applied = scrollToElement(
          lastAnchor,
          { align: "start" },
          { keepPreviousPeek: true },
        );
      }
    } else if (position === "end") {
      applied = scrollToEnd({ behavior: "auto" });
    } else {
      applied = scrollToStart({ behavior: "auto" });
    }
    if (applied) {
      defaultApplied = true;
      setPendingScroll(false);
    }
    return applied;
  };

  const flushPendingScrollToMessage = () => {
    const pending = pendingMessage;
    if (!pending) return false;
    const element = messageElements.get(pending.id);
    if (!element || !scrollToElement(element, pending.options)) return false;
    pendingMessage = null;
    defaultApplied = true;
    setPendingScroll(false);
    return true;
  };

  const schedulePendingFlush = () => {
    if (pendingFrame !== null) return;
    pendingFrame = window.requestAnimationFrame(() => {
      pendingFrame = null;
      if (flushPendingScrollToMessage()) capturePrependAnchor();
    });
  };

  const scrollToMessage = (
    messageId: string,
    command?: MessageScrollerScrollOptions,
  ) => {
    const element = messageElements.get(messageId);
    if (element) {
      if (scrollToElement(element, command)) {
        pendingMessage = null;
        return true;
      }
      pendingMessage = { id: messageId, options: command };
      return true;
    }
    // 会话尚未挂载任何行时可排队（客户端解析永久链接）；已挂载但缺失则返回 false
    if (itemCount === 0) {
      pendingMessage = { id: messageId, options: command };
      setPendingScroll(false);
      return true;
    }
    return false;
  };

  const capturePrependAnchor = () => {
    const vp = viewport();
    if (!vp) {
      prependAnchor = null;
      return;
    }
    const vpRect = vp.getBoundingClientRect();
    const firstVisible =
      items().find((el) => {
        if (!el.dataset.messageId) return false;
        const rect = el.getBoundingClientRect();
        return rect.bottom > vpRect.top && rect.top < vpRect.bottom;
      }) ?? null;
    prependAnchor = firstVisible
      ? { element: firstVisible, viewportTop: itemTopInViewport(firstVisible) }
      : null;
  };

  const restorePrependAnchor = () => {
    const anchor = prependAnchor;
    const vp = viewport();
    if (!anchor || !vp || !anchor.element.isConnected) return false;
    const delta = itemTopInViewport(anchor.element) - anchor.viewportTop;
    if (Math.abs(delta) <= AT_EDGE_TOLERANCE) return false;
    vp.scrollTop += delta;
    anchor.viewportTop = itemTopInViewport(anchor.element);
    scheduleStateCommit();
    scheduleVisibilitySync();
    return true;
  };

  const handleContentChange = () => {
    const root = content();
    if (!root) return;
    const list = items();
    const previousCount = itemCount;
    const previousFirst = firstItem;
    itemCount = list.length;
    firstItem = list[0] ?? null;

    // 空会话不隐藏视口（data-pending-scroll 跳过）
    if (list.length === 0) setPendingScroll(false);

    if (flushPendingScrollToMessage()) {
      capturePrependAnchor();
      return;
    }

    if (previousCount === 0) {
      // 初次定位时把已存在的锚点标记为已处理，避免后续 resize/属性变化误触发重锚定
      for (const el of list) {
        if (el.dataset.scrollAnchor === "true") handledScrollAnchors.add(el);
      }
      if (applyDefaultScrollPosition()) {
        capturePrependAnchor();
        return;
      }
      if (
        list.length > 0 &&
        options().autoScroll &&
        scrollToEnd({ behavior: "auto" })
      ) {
        capturePrependAnchor();
        return;
      }
      commitScrollState();
      scheduleVisibilitySync();
      capturePrependAnchor();
      return;
    }

    const previousFirstIndex = previousFirst ? list.indexOf(previousFirst) : -1;
    if (preserveScrollOnPrepend() && previousFirstIndex > 0) {
      restorePrependAnchor();
      capturePrependAnchor();
      return;
    }

    if (list.length > previousCount) {
      const firstNewAnchor = firstAnchorFrom(list, previousCount);
      if (firstNewAnchor) {
        // 同批新增多个锚点：跟随底部，避免在多个锚点间跳来跳去
        if (
          options().autoScroll &&
          scrollState.isFollowing() &&
          hasMultipleAnchorsFrom(list, previousCount)
        ) {
          scrollToEnd({ behavior: "auto" });
          capturePrependAnchor();
          return;
        }
        scrollToElement(
          firstNewAnchor,
          { align: "start" },
          { keepPreviousPeek: true },
        );
        handledScrollAnchors.add(firstNewAnchor);
        capturePrependAnchor();
        return;
      }
    }

    // 行数没变但出现了未处理的新锚点（例如给已有行打开 scrollAnchor）
    if (list.length === previousCount) {
      const unhandled = firstUnhandledAnchor(list, handledScrollAnchors);
      if (unhandled) {
        scrollToElement(
          unhandled,
          { align: "start" },
          { keepPreviousPeek: true },
        );
        handledScrollAnchors.add(unhandled);
        capturePrependAnchor();
        return;
      }
    }

    if (scrollState.isFollowing() && options().autoScroll) {
      scrollToEnd({ behavior: "auto" });
    } else {
      commitScrollState();
      scheduleVisibilitySync();
    }
    capturePrependAnchor();
  };

  const handleResize = () => {
    if (scrollState.isFollowing() && options().autoScroll) {
      scrollToEnd({ behavior: "auto" });
      return;
    }
    const before = commands.spacerHeight();
    if (reanchorToAnchoredMessage()) {
      if (options().autoScroll && before > 0 && commands.spacerHeight() === 0) {
        scrollToEnd({ behavior: "auto" });
      }
      return;
    }
    scheduleStateCommit();
    scheduleVisibilitySync();
  };

  const syncAfterScroll = () => {
    commitScrollState();
    scheduleVisibilitySync();
    capturePrependAnchor();
  };

  const registerMessage = (
    id: string,
    element: HTMLElement | undefined,
    previous?: HTMLElement,
  ) => {
    if (element) {
      messageElements.set(id, element);
      visibility.observe(element);
      scheduleVisibilitySync();
      if (pendingMessage?.id === id) schedulePendingFlush();
      return;
    }
    if (previous && messageElements.get(id) === previous) {
      messageElements.delete(id);
      visibility.unobserve(id, previous);
      scheduleVisibilitySync();
    }
  };

  const registerItem = (entry: MessageScrollerItemEntry) => {
    const id = entry.id;
    if (id) registerMessage(id, entry.element);
    return () => {
      if (id) registerMessage(id, undefined, entry.element);
    };
  };

  /** 公共入口：挂上尾部 spacer 元素，并让它记录行间距（用于负 margin 抵消） */
  const attachSpacer = (element: HTMLElement | undefined) => {
    setSpacerSignal(element);
    setSpacerElement(element);
  };

  // 内容观察：初次定位 / prepend 保位 / 新回合锚定 / 跟随 / 尺寸
  createEffect(() => {
    const root = content();
    if (!root) return;
    handleContentChange();

    const mutation =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => handleContentChange())
        : null;
    mutation?.observe(root, { childList: true });

    // 已有行切换 scrollAnchor（dataset 变化）也要重新锚定
    const anchorMutation =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => handleContentChange())
        : null;
    anchorMutation?.observe(root, {
      attributes: true,
      attributeFilter: ["data-scroll-anchor"],
      subtree: true,
    });

    let frame = 0;
    const resize =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(handleResize);
          })
        : null;
    resize?.observe(root);

    onCleanup(() => {
      mutation?.disconnect();
      anchorMutation?.disconnect();
      resize?.disconnect();
      window.cancelAnimationFrame(frame);
    });
  });

  // 视口：scroll / 用户滚动意图 / 尺寸
  createEffect(() => {
    const vp = viewport();
    if (!vp) return;
    visibility.ensureObserver();

    const onScroll = () => syncAfterScroll();
    const onIntent = () => releaseFollow();
    const onKeyDown = (event: KeyboardEvent) => {
      if (NAV_KEYS.has(event.key)) releaseFollow();
    };
    vp.addEventListener("scroll", onScroll, { passive: true });
    vp.addEventListener("wheel", onIntent, { passive: true });
    vp.addEventListener("touchmove", onIntent, { passive: true });
    vp.addEventListener("keydown", onKeyDown);

    let frame = 0;
    const resize =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(handleResize);
          })
        : null;
    resize?.observe(vp);

    onCleanup(() => {
      vp.removeEventListener("scroll", onScroll);
      vp.removeEventListener("wheel", onIntent);
      vp.removeEventListener("touchmove", onIntent);
      vp.removeEventListener("keydown", onKeyDown);
      resize?.disconnect();
      window.cancelAnimationFrame(frame);
    });
  });

  onCleanup(() => {
    if (pendingFrame !== null) window.cancelAnimationFrame(pendingFrame);
    scrollState.dispose();
    visibility.dispose();
  });

  return {
    viewport,
    setViewport,
    content,
    setContent,
    setSpacer: attachSpacer,
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
    subscribeVisibility: visibility.subscribe,
    options,
  };
}
