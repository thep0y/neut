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
import { rowGap } from "./message-scroller.measure";
import { createDomMeasure } from "./message-scroller.dom-measure";
import { createVisibility } from "./message-scroller.visibility";
import { AT_EDGE_TOLERANCE } from "./message-scroller.utils";
import { targetTopFor as computeTargetTopFor } from "./message-scroller.scroll-target";

/** 「滚动到最新」后 data-autoscrolling 的持续时间 */
const AUTO_SCROLLING_TIMEOUT_MS = 180;
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

type Mode =
  | "following-bottom"
  | "free-scrolling"
  | "anchored-to-message"
  | "settling-jump";

interface ScrollState {
  start: boolean;
  end: boolean;
}

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
  const [spacer, setSpacer] = createSignal<HTMLElement>();
  const [preserveScrollOnPrepend, setPreserveScrollOnPrepend] =
    createSignal(true);
  const [scrollableStart, setScrollableStart] = createSignal(false);
  const [scrollableEnd, setScrollableEnd] = createSignal(false);
  const [autoscrolling, setAutoscrolling] = createSignal(false);
  const [pendingScroll, setPendingScroll] = createSignal(
    options().defaultScrollPosition !== "start",
  );

  const messageElements = new Map<string, HTMLElement>();
  const handledScrollAnchors = new WeakSet<HTMLElement>();

  let mode: Mode = options().autoScroll ? "following-bottom" : "free-scrolling";
  let lastScrollTop = 0;
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
  let spacerHeight = 0;
  let spacerGap = 0;
  let autoscrollingTimer: number | null = null;
  let stateFrame: number | null = null;
  let pendingFrame: number | null = null;

  const measure = createDomMeasure({ viewport, content, spacer });
  const {
    items,
    itemOffsetTop,
    itemTopInViewport,
    contentBottom,
    maxScrollTop,
  } = measure;

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

  /** 设置尾部 spacer：让目标行有空间滚到指定位置；0 时隐藏 */
  const setSpacerHeight = (height: number) => {
    const sp = spacer();
    if (!sp) return;
    const next = Math.max(0, Math.ceil(height));
    if (spacerHeight === next) return;
    spacerHeight = next;
    sp.hidden = next === 0;
    sp.style.height = `${next}px`;
    sp.style.marginTop = next > 0 ? `${-spacerGap}px` : "";
  };

  const computeScrollable = (): ScrollState => {
    const vp = viewport();
    const root = content();
    if (!vp || !root) return { start: false, end: false };
    const threshold = options().scrollEdgeThreshold;
    const bottom = contentBottom();
    return {
      start: vp.scrollTop > threshold,
      end: bottom - vp.scrollTop - vp.clientHeight > threshold,
    };
  };

  const updateModeFromScroll = (state: ScrollState) => {
    const vp = viewport();
    if (!vp) return;
    const top = vp.scrollTop;
    const movedUp = top < lastScrollTop - AT_EDGE_TOLERANCE;
    lastScrollTop = top;
    if (
      options().autoScroll &&
      !state.end &&
      mode !== "settling-jump" &&
      mode !== "anchored-to-message"
    ) {
      mode = "following-bottom";
    } else if (
      mode === "following-bottom" &&
      state.end &&
      movedUp &&
      !autoscrolling()
    ) {
      mode = "free-scrolling";
    }
  };

  const commitScrollState = () => {
    const state = computeScrollable();
    updateModeFromScroll(state);
    // 跟随输出时对 UI 隐藏「还能向下滚」——按钮不出现，直到读者回到实时边缘
    const exposed =
      mode === "following-bottom" ? { ...state, end: false } : state;
    setScrollableStart(exposed.start);
    setScrollableEnd(exposed.end);
  };

  const scheduleStateCommit = () => {
    if (stateFrame !== null) return;
    stateFrame = window.requestAnimationFrame(() => {
      stateFrame = null;
      commitScrollState();
    });
  };

  const applyAutoscrolling = (next: boolean) => {
    if (autoscrollingTimer !== null) {
      window.clearTimeout(autoscrollingTimer);
      autoscrollingTimer = null;
    }
    if (autoscrolling() !== next) {
      setAutoscrolling(next);
      commitScrollState();
    }
    if (next) {
      autoscrollingTimer = window.setTimeout(() => {
        autoscrollingTimer = null;
        setAutoscrolling(false);
        commitScrollState();
      }, AUTO_SCROLLING_TIMEOUT_MS);
    }
  };

  const setScrollTop = (
    top: number,
    {
      behavior = "auto" as ScrollBehavior,
      auto = false,
    }: { behavior?: ScrollBehavior; auto?: boolean } = {},
  ) => {
    const vp = viewport();
    if (!vp) return;
    const next = Math.max(0, top);
    if (Math.abs(vp.scrollTop - next) <= AT_EDGE_TOLERANCE) {
      vp.scrollTop = next;
      commitScrollState();
      return;
    }
    if (auto) applyAutoscrolling(true);
    vp.scrollTo({ top: next, behavior });
    scheduleStateCommit();
  };

  const scrollToStart = (command?: MessageScrollerScrollOptions) => {
    if (!viewport()) return false;
    setSpacerHeight(0);
    streamingTurn = null;
    mode = "free-scrolling";
    setScrollTop(0, { behavior: command?.behavior ?? "auto" });
    scheduleVisibilitySync();
    return true;
  };

  const scrollToEnd = (command?: MessageScrollerScrollOptions) => {
    if (!viewport()) return false;
    setSpacerHeight(0);
    streamingTurn = null;
    mode = options().autoScroll ? "following-bottom" : "free-scrolling";
    setScrollTop(maxScrollTop(), {
      behavior: command?.behavior ?? "auto",
      auto: true,
    });
    scheduleVisibilitySync();
    return true;
  };

  const targetTopFor = (
    element: HTMLElement,
    command: MessageScrollerScrollOptions | undefined,
    margin: number,
  ) => {
    const vp = viewport();
    if (!vp) return 0;
    return computeTargetTopFor(
      element,
      command,
      margin,
      vp,
      content(),
      itemOffsetTop,
    );
  };

  const scrollToElement = (
    element: HTMLElement,
    command?: MessageScrollerScrollOptions,
    { keepPreviousPeek = false }: { keepPreviousPeek?: boolean } = {},
  ) => {
    const vp = viewport();
    const root = content();
    if (!vp || !root?.contains(element)) return false;
    const margin =
      (command?.scrollMargin ?? options().scrollMargin) +
      (keepPreviousPeek ? options().scrollPreviousItemPeek : 0);
    const target = targetTopFor(element, command, margin);
    setSpacerHeight(Math.max(0, target + vp.clientHeight - contentBottom()));
    prependAnchor = { element, viewportTop: itemTopInViewport(element) };
    mode = keepPreviousPeek ? "anchored-to-message" : "settling-jump";
    streamingTurn = keepPreviousPeek ? element : null;
    setScrollTop(target, { behavior: command?.behavior ?? "auto" });
    scheduleVisibilitySync();
    return true;
  };

  const reanchorToAnchoredMessage = () => {
    const el = streamingTurn;
    if (!el?.isConnected || mode !== "anchored-to-message") return false;
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
          mode === "following-bottom" &&
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

    if (mode === "following-bottom" && options().autoScroll) {
      scrollToEnd({ behavior: "auto" });
    } else {
      commitScrollState();
      scheduleVisibilitySync();
    }
    capturePrependAnchor();
  };

  const handleResize = () => {
    if (mode === "following-bottom" && options().autoScroll) {
      scrollToEnd({ behavior: "auto" });
      return;
    }
    const before = spacerHeight;
    if (reanchorToAnchoredMessage()) {
      if (options().autoScroll && before > 0 && spacerHeight === 0) {
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

  /** 滚轮/触摸/键盘滚动：立刻放弃跟随，把位置交还读者 */
  const releaseFollow = () => {
    if (
      mode === "following-bottom" ||
      mode === "anchored-to-message" ||
      mode === "settling-jump"
    ) {
      applyAutoscrolling(false);
      mode = "free-scrolling";
    }
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

  const setSpacerElement = (element: HTMLElement | undefined) => {
    setSpacer(element);
    spacerGap = rowGap(element?.parentElement ?? null);
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
    if (autoscrollingTimer !== null) window.clearTimeout(autoscrollingTimer);
    if (stateFrame !== null) window.cancelAnimationFrame(stateFrame);
    if (pendingFrame !== null) window.cancelAnimationFrame(pendingFrame);
    visibility.dispose();
  });

  return {
    viewport,
    setViewport,
    content,
    setContent,
    setSpacer: setSpacerElement,
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
