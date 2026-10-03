import { createEffect, createSignal, onCleanup } from "solid-js";
import type {
  MessageScrollerContextValue,
  MessageScrollerItemEntry,
  MessageScrollerProviderProps,
} from "./message-scroller.types";
import { createDomMeasure } from "./message-scroller.dom-measure";
import { createAnchoring } from "./message-scroller.anchoring";
import { createScrollCommands } from "./message-scroller.commands";
import { createScrollState } from "./message-scroller.scroll-state";
import { createVisibility } from "./message-scroller.visibility";

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

  const messageElements = new Map<string, HTMLElement>();

  const measure = createDomMeasure({ viewport, content, spacer });
  const { items, contentBottom } = measure;

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
  const { setSpacerElement } = commands;

  const anchoring = createAnchoring({
    viewport,
    content,
    options,
    measure,
    commands,
    state: scrollState,
    scheduleState: scheduleStateCommit,
    commitState: commitScrollState,
    scheduleVisibility: scheduleVisibilitySync,
    preserveScrollOnPrepend,
    getMessageElement: (id) => messageElements.get(id),
  });
  const {
    pendingScroll,
    scrollToStart,
    scrollToEnd,
    scrollToMessage,
    handleContentChange,
    handleResize,
    syncAfterScroll,
  } = anchoring;

  const registerMessage = (
    id: string,
    element: HTMLElement | undefined,
    previous?: HTMLElement,
  ) => {
    if (element) {
      messageElements.set(id, element);
      visibility.observe(element);
      scheduleVisibilitySync();
      anchoring.notifyMessageRegistered(id);
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
    anchoring.dispose();
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
