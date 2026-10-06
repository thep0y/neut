import { createSignal, type Accessor } from "solid-js";
import type { MessageScrollerProviderProps } from "./message-scroller.types";
import { AT_EDGE_TOLERANCE } from "./message-scroller.utils";

/**
 * MessageScroller 的可见性与阅读锚点。
 *
 * 单一职责：回答"哪些行当前可见""读者的阅读行是哪个锚点"。
 * 观察器按需建立（首个订阅者创建、最后一个撤销时断开），不支持
 * `IntersectionObserver` 时退化为逐帧按矩形测量。
 *
 * 本模块不碰 scrollTop、不决定锚定——那是 commands / anchoring 的事。
 * 行注册表留在引擎（见 REFACTOR-PLAN.md §D4），因此这里只接收
 * "把某个元素纳入/移出观察"的通知。
 */

type EngineOptions = Required<Omit<MessageScrollerProviderProps, "children">>;

export interface VisibilityOptions {
  viewport: Accessor<HTMLElement | undefined>;
  content: Accessor<HTMLElement | undefined>;
  /** 会话里的行（按 DOM 顺序，已排除 spacer），来自 `dom-measure` */
  items: () => HTMLElement[];
  options: () => EngineOptions;
  /** 已注册行的元素（建立观察器时逐个 observe） */
  registeredElements: () => Iterable<HTMLElement>;
}

export interface Visibility {
  /** 阅读行：视口顶部 + scrollMargin + peek 之上最后一个锚点 */
  currentAnchorId: Accessor<string | null>;
  /** 当前可见的消息 id（有 IO 时来自回调集合，否则按矩形判定） */
  visibleMessageIds: Accessor<string[]>;
  /** 把行纳入观察（挂载时调用） */
  observe: (element: HTMLElement) => void;
  /** 停止观察并从可见集合里移除（卸载时调用） */
  unobserve: (id: string, element: HTMLElement) => void;
  /** 分帧同步一次（滚动、内容变化、IO 回调之后调用） */
  schedule: () => void;
  /** 订阅计数大于 0 但观察器还没建立时补建（view 挂载后调用） */
  ensureObserver: () => void;
  /** 订阅可见性；返回撤销函数（可重复调用） */
  subscribe: () => () => void;
  /** 引擎卸载清理：取消未执行的帧、断开观察器 */
  dispose: () => void;
}

export function createVisibility(options: VisibilityOptions): Visibility {
  const [currentAnchorId, setCurrentAnchorId] = createSignal<string | null>(
    null,
  );
  const [visibleMessageIds, setVisibleMessageIds] = createSignal<string[]>([]);

  const visibleIds = new Set<string>();
  let observer: IntersectionObserver | null = null;
  let visibilityFrame: number | null = null;
  let visibilitySubscribers = 0;

  const schedule = () => {
    if (visibilityFrame !== null) return;
    visibilityFrame = window.requestAnimationFrame(() => {
      visibilityFrame = null;
      if (visibilitySubscribers > 0) computeVisibility();
    });
  };

  const computeVisibility = () => {
    const viewport = options.viewport();
    const content = options.content();
    if (!viewport || !content) {
      setVisibleMessageIds([]);
      setCurrentAnchorId(null);
      return;
    }

    const viewportRect = viewport.getBoundingClientRect();
    const readingLine =
      viewportRect.top +
      options.options().scrollMargin +
      options.options().scrollPreviousItemPeek;
    // 没有 IO 时只能自己量；有 IO 时"可见"由回调投递的集合决定
    const withoutObserver = typeof IntersectionObserver === "undefined";
    const visible: string[] = [];
    let anchorId: string | null = null;

    for (const item of options.items()) {
      const id = item.dataset.messageId;
      if (!id) continue;

      const isAnchor = item.dataset.scrollAnchor === "true";
      const rect =
        isAnchor || withoutObserver ? item.getBoundingClientRect() : null;
      const isVisible =
        withoutObserver && rect
          ? rect.bottom > readingLine && rect.top < viewportRect.bottom
          : visibleIds.has(id);

      if (isVisible) visible.push(id);
      // 阅读行取"已经越过阅读线的最后一个锚点"
      if (isAnchor && rect && rect.top <= readingLine + AT_EDGE_TOLERANCE) {
        anchorId = id;
      }
    }

    if (visible.length === 0 && anchorId === null) {
      setVisibleMessageIds([]);
      setCurrentAnchorId(null);
      return;
    }
    setVisibleMessageIds(visible);
    setCurrentAnchorId(anchorId);
  };

  const startObserver = () => {
    if (typeof IntersectionObserver === "undefined") {
      schedule();
      return;
    }
    const viewport = options.viewport();
    if (!observer && viewport) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).dataset.messageId;
            if (!id) continue;
            if (entry.isIntersecting) visibleIds.add(id);
            else visibleIds.delete(id);
          }
          schedule();
        },
        {
          root: viewport,
          rootMargin: `${-(options.options().scrollMargin + options.options().scrollPreviousItemPeek)}px 0px 0px 0px`,
          threshold: [0, 0.01, 0.5, 1],
        },
      );
    }
    for (const element of options.registeredElements()) {
      observer?.observe(element);
    }
    schedule();
  };

  const stopObserver = () => {
    if (visibilityFrame !== null) {
      window.cancelAnimationFrame(visibilityFrame);
      visibilityFrame = null;
    }
    observer?.disconnect();
    observer = null;
    visibleIds.clear();
    setVisibleMessageIds([]);
    setCurrentAnchorId(null);
  };

  return {
    currentAnchorId,
    visibleMessageIds,
    schedule,
    ensureObserver() {
      if (visibilitySubscribers > 0 && !observer) startObserver();
    },
    observe(element) {
      observer?.observe(element);
    },
    unobserve(id, element) {
      visibleIds.delete(id);
      observer?.unobserve(element);
    },
    subscribe() {
      visibilitySubscribers += 1;
      if (visibilitySubscribers === 1) startObserver();
      schedule();

      let released = false;
      return () => {
        if (released) return;
        released = true;
        visibilitySubscribers -= 1;
        if (visibilitySubscribers === 0) stopObserver();
      };
    },
    dispose() {
      if (visibilityFrame !== null) {
        window.cancelAnimationFrame(visibilityFrame);
        visibilityFrame = null;
      }
      observer?.disconnect();
      observer = null;
    },
  };
}
