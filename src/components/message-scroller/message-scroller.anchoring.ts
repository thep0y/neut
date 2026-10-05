import { createSignal, type Accessor } from "solid-js";
import {
  firstAnchorFrom,
  firstUnhandledAnchor,
  hasMultipleAnchorsFrom,
} from "./message-scroller.anchors";
import type { DomMeasure } from "./message-scroller.dom-measure";
import type { ScrollCommands } from "./message-scroller.commands";
import type { ScrollState } from "./message-scroller.scroll-state";
import type {
  MessageScrollerProviderProps,
  MessageScrollerScrollOptions,
} from "./message-scroller.types";
import { AT_EDGE_TOLERANCE } from "./message-scroller.utils";

type EngineOptions = Required<Omit<MessageScrollerProviderProps, "children">>;

/**
 * 锚定与保位。
 *
 * 单一职责：决定"内容变了之后该滚到哪里"——初次定位、prepend 保位、
 * 新回合锚定、回复生长的原地重锚定、以及 `scrollToMessage` 的排队补滚。
 * 它只调用 `ScrollCommands` 的命令，自己不写 `scrollTop`、不读 IO。
 *
 * 之所以独立成块：这 200 行里全是**判断**（行数变没变、首个可见行是否被挤下去、
 * 新锚点是一个还是一批、锚点是否已处理过），而几何与模式迁移都在别的模块里，
 * 拆开后这些判断可以单独表述。
 */
export interface AnchoringOptions {
  viewport: Accessor<HTMLElement | undefined>;
  content: Accessor<HTMLElement | undefined>;
  options: () => EngineOptions;
  measure: DomMeasure;
  commands: ScrollCommands;
  state: ScrollState;
  /** 分帧提交滚动状态（`scroll-state.schedule`） */
  scheduleState: () => void;
  /** 立即提交滚动状态（`scroll-state.commit`） */
  commitState: () => void;
  /** 同步一次可见性 */
  scheduleVisibility: () => void;
  /** Viewport 的 prop：上方插入历史时是否保持可见行 */
  preserveScrollOnPrepend: Accessor<boolean>;
  /** 查询某个 id 是否已挂载（行注册表由引擎持有） */
  getMessageElement: (id: string) => HTMLElement | undefined;
}

export interface Anchoring {
  /** 是否要在应用定位前用 `data-pending-scroll` 遮住视口 */
  pendingScroll: Accessor<boolean>;
  scrollToStart: (command?: MessageScrollerScrollOptions) => boolean;
  scrollToEnd: (command?: MessageScrollerScrollOptions) => boolean;
  scrollToElement: (
    element: HTMLElement,
    command?: MessageScrollerScrollOptions,
    options?: { keepPreviousPeek?: boolean },
  ) => boolean;
  scrollToMessage: (
    messageId: string,
    command?: MessageScrollerScrollOptions,
  ) => boolean;
  /** 回复生长时把锚定行原地固定回阅读线 */
  reanchorToAnchoredMessage: () => boolean;
  /** 内容子元素变化（MutationObserver / 初次挂载） */
  handleContentChange: () => void;
  /** 尺寸变化（ResizeObserver） */
  handleResize: () => void;
  /** 滚动之后：提交状态 + 同步可见性 + 重记 prepend 锚点 */
  syncAfterScroll: () => void;
  /** 记忆首个可见行（prepend 保位用） */
  capturePrependAnchor: () => void;
  /** 某一行注册进来时调用：若正在等它，排一次补滚 */
  notifyMessageRegistered: (id: string) => void;
  dispose: () => void;
}

export function createAnchoring(options: AnchoringOptions): Anchoring {
  const [pendingScroll, setPendingScroll] = createSignal(
    options.options().defaultScrollPosition !== "start",
  );

  const handledScrollAnchors = new WeakSet<HTMLElement>();
  let itemCount = 0;
  let firstItem: HTMLElement | null = null;
  let defaultApplied = false;
  /** 当前"锚定/正在生长"的那一行（原地重锚定的目标） */
  let streamingTurn: HTMLElement | null = null;
  let pendingMessage: {
    id: string;
    options?: MessageScrollerScrollOptions;
  } | null = null;
  /** 首个可见行及其视口位置（prepend 保位用） */
  let prependAnchor: { element: HTMLElement; viewportTop: number } | null =
    null;
  let pendingFrame: number | null = null;

  const capturePrependAnchor = () => {
    const viewport = options.viewport();
    if (!viewport) {
      prependAnchor = null;
      return;
    }
    const viewportRect = viewport.getBoundingClientRect();
    const firstVisible =
      options.measure.items().find((element) => {
        if (!element.dataset.messageId) return false;
        const rect = element.getBoundingClientRect();
        return rect.bottom > viewportRect.top && rect.top < viewportRect.bottom;
      }) ?? null;
    prependAnchor = firstVisible
      ? {
          element: firstVisible,
          viewportTop: options.measure.itemTopInViewport(firstVisible),
        }
      : null;
  };

  const restorePrependAnchor = () => {
    const anchor = prependAnchor;
    const viewport = options.viewport();
    if (!anchor || !viewport || !anchor.element.isConnected) return false;

    // 按"首个可见行相对视口的位移"补偿，而不是猜测高度差
    const delta =
      options.measure.itemTopInViewport(anchor.element) - anchor.viewportTop;
    if (Math.abs(delta) <= AT_EDGE_TOLERANCE) return false;

    viewport.scrollTop += delta;
    anchor.viewportTop = options.measure.itemTopInViewport(anchor.element);
    options.scheduleState();
    options.scheduleVisibility();
    return true;
  };

  /** 命令包装：命令负责滚动与 spacer，这里负责锚定状态（prependAnchor / streamingTurn） */
  const scrollToStart = (command?: MessageScrollerScrollOptions) => {
    streamingTurn = null;
    return options.commands.scrollToStart(command);
  };

  const scrollToEnd = (command?: MessageScrollerScrollOptions) => {
    streamingTurn = null;
    return options.commands.scrollToEnd(command);
  };

  const scrollToElement: Anchoring["scrollToElement"] = (
    element,
    command,
    { keepPreviousPeek = false } = {},
  ) => {
    const ok = options.commands.scrollToElement(element, command, {
      keepPreviousPeek,
    });
    if (!ok) return false;

    prependAnchor = {
      element,
      viewportTop: options.measure.itemTopInViewport(element),
    };
    streamingTurn = keepPreviousPeek ? element : null;
    return true;
  };

  const reanchorToAnchoredMessage = () => {
    const element = streamingTurn;
    if (!element?.isConnected || !options.state.isAnchored()) return false;
    return scrollToElement(
      element,
      { align: "start" },
      { keepPreviousPeek: true },
    );
  };

  const applyDefaultScrollPosition = () => {
    const viewport = options.viewport();
    if (!viewport || defaultApplied || itemCount === 0) return false;

    const position = options.options().defaultScrollPosition;
    let applied = false;
    if (position === "last-anchor") {
      const list = options.measure.items();
      const lastAnchor =
        [...list].reverse().find((el) => el.dataset.scrollAnchor === "true") ??
        null;
      if (!lastAnchor) {
        applied = scrollToEnd({ behavior: "auto" });
      } else if (
        options.measure.contentBottom() -
          options.measure.itemOffsetTop(lastAnchor) <=
        viewport.clientHeight
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

    const element = options.getMessageElement(pending.id);
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

  const scrollToMessage: Anchoring["scrollToMessage"] = (
    messageId,
    command,
  ) => {
    const element = options.getMessageElement(messageId);
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

  const handleContentChange = () => {
    const content = options.content();
    if (!content) return;

    const list = options.measure.items();
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
      for (const element of list) {
        if (element.dataset.scrollAnchor === "true") {
          handledScrollAnchors.add(element);
        }
      }
      if (applyDefaultScrollPosition()) {
        capturePrependAnchor();
        return;
      }
      if (
        list.length > 0 &&
        options.options().autoScroll &&
        scrollToEnd({ behavior: "auto" })
      ) {
        capturePrependAnchor();
        return;
      }
      options.commitState();
      options.scheduleVisibility();
      capturePrependAnchor();
      return;
    }

    // 走到这里说明 previousCount > 0：上一次测量时列表非空，而那次已经把
    // firstItem 设成了当时的首项，因此 previousFirst 必然非空，无需再兜底。
    const previousFirstIndex = list.indexOf(previousFirst as HTMLElement);
    if (options.preserveScrollOnPrepend() && previousFirstIndex > 0) {
      restorePrependAnchor();
      capturePrependAnchor();
      return;
    }

    if (list.length > previousCount) {
      const firstNewAnchor = firstAnchorFrom(list, previousCount);
      if (firstNewAnchor) {
        // 同批新增多个锚点：跟随底部，避免在多个锚点间跳来跳去
        if (
          options.options().autoScroll &&
          options.state.isFollowing() &&
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

    if (options.state.isFollowing() && options.options().autoScroll) {
      scrollToEnd({ behavior: "auto" });
    } else {
      options.commitState();
      options.scheduleVisibility();
    }
    capturePrependAnchor();
  };

  const handleResize = () => {
    if (options.state.isFollowing() && options.options().autoScroll) {
      scrollToEnd({ behavior: "auto" });
      return;
    }
    const before = options.commands.spacerHeight();
    if (reanchorToAnchoredMessage()) {
      if (
        options.options().autoScroll &&
        before > 0 &&
        options.commands.spacerHeight() === 0
      ) {
        scrollToEnd({ behavior: "auto" });
      }
      return;
    }
    options.scheduleState();
    options.scheduleVisibility();
  };

  const syncAfterScroll = () => {
    options.commitState();
    options.scheduleVisibility();
    capturePrependAnchor();
  };

  return {
    pendingScroll,
    scrollToStart,
    scrollToEnd,
    scrollToElement,
    scrollToMessage,
    reanchorToAnchoredMessage,
    handleContentChange,
    handleResize,
    syncAfterScroll,
    capturePrependAnchor,
    notifyMessageRegistered(id) {
      if (pendingMessage?.id === id) schedulePendingFlush();
    },
    dispose() {
      if (pendingFrame !== null) {
        window.cancelAnimationFrame(pendingFrame);
        pendingFrame = null;
      }
    },
  };
}
