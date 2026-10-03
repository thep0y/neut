import { renderHook } from "@solidjs/testing-library";
import { createComponent, type JSX } from "solid-js";
import { vi } from "vitest";
import { MessageScrollerContext } from "~/components/message-scroller/message-scroller.context";
import type {
  MessageScrollerContextValue,
  MessageScrollerProviderProps,
} from "~/components/message-scroller/message-scroller.types";
import { useMessageScrollerEngine } from "~/components/message-scroller/useMessageScrollerEngine";

/**
 * `useMessageScrollerEngine` 的测试脚手架。
 *
 * jsdom 不做布局：所有 `getBoundingClientRect()` 恒为 0、`scrollHeight`/`clientHeight`
 * 恒为 0。滚动引擎的核心算法都建立在真实测量之上，因此这里显式 stub 这些 API，
 * 用一个「可控坐标系」来驱动引擎（TESTING.md §4.5：只 mock 系统边界）。
 */

export type EngineOptions = Required<
  Omit<MessageScrollerProviderProps, "children">
>;

/**
 * 与 `MessageScrollerProvider` 的 `mergeProps` 默认值保持一致。
 * 默认值定义在 Provider 里（引擎本身要求调用方给全），因此测试侧显式复刻一份；
 * 若哪天 Provider 改了默认值，这里的断言会提醒同步（TESTING.md §7 文档联动）。
 */
export const ENGINE_DEFAULTS: EngineOptions = {
  autoScroll: false,
  defaultScrollPosition: "end",
  scrollEdgeThreshold: 8,
  scrollMargin: 0,
  scrollPreviousItemPeek: 64,
};

/** 造一个 DOMRect（jsdom 里没有构造函数，只能手写） */
export function rect(
  top: number,
  bottom: number,
  height = bottom - top,
): DOMRect {
  return {
    top,
    bottom,
    height,
    left: 0,
    right: 0,
    width: 0,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

/** 让元素报告指定矩形，并把它挂到 body */
export function measured(
  el: HTMLElement,
  box: { top: number; bottom: number; height?: number },
): HTMLElement {
  el.getBoundingClientRect = () => rect(box.top, box.bottom, box.height);
  document.body.appendChild(el);
  return el;
}

/** 让元素报告指定矩形（不挂载） */
export function stubRect(
  el: HTMLElement,
  box: { top: number; bottom: number; height?: number },
): HTMLElement {
  el.getBoundingClientRect = () => rect(box.top, box.bottom, box.height);
  return el;
}

/** 设置滚动容器的可滚动尺寸 */
export function setScrollMetrics(
  el: HTMLElement,
  size: { scrollHeight: number; clientHeight: number },
): void {
  Object.defineProperty(el, "scrollHeight", {
    configurable: true,
    value: size.scrollHeight,
  });
  Object.defineProperty(el, "clientHeight", {
    configurable: true,
    value: size.clientHeight,
  });
}

/** 设置可写、可读的 scrollTop（jsdom 的属性默认不可写） */
export function setScrollTop(el: HTMLElement, value: number): void {
  Object.defineProperty(el, "scrollTop", {
    configurable: true,
    writable: true,
    value,
  });
}

export interface ScrollToCall {
  top: number;
  behavior?: string;
}

export interface DomFixture {
  viewport: HTMLElement;
  content: HTMLElement;
  scrollToCalls: ScrollToCall[];
}

/** 构造一个可控的 viewport + content，并记录 scrollTo 调用 */
export function setupDom(
  options: {
    scrollTop?: number;
    scrollHeight?: number;
    clientHeight?: number;
  } = {},
): DomFixture {
  const viewport = document.createElement("div");
  const content = document.createElement("div");
  setScrollMetrics(viewport, {
    scrollHeight: options.scrollHeight ?? 1000,
    clientHeight: options.clientHeight ?? 400,
  });
  setScrollTop(viewport, options.scrollTop ?? 0);
  measured(viewport, {
    top: 0,
    bottom: options.clientHeight ?? 400,
  });

  const scrollToCalls: ScrollToCall[] = [];
  viewport.scrollTo = ((arg: ScrollToOptions | number) => {
    const top = typeof arg === "number" ? arg : (arg.top ?? 0);
    scrollToCalls.push({
      top,
      behavior: typeof arg === "number" ? undefined : arg.behavior,
    });
    viewport.scrollTop = top;
  }) as typeof viewport.scrollTo;

  viewport.appendChild(content);
  document.body.appendChild(viewport);

  return { viewport, content, scrollToCalls };
}

/** 往 content 里加一个「行」 */
export function addRow(
  content: HTMLElement,
  id: string,
  box: { top: number; bottom: number },
  anchor = false,
): HTMLElement {
  const row = document.createElement("div");
  row.setAttribute("data-message-id", id);
  // 与 MessageScrollerItem 一致：始终输出 "true"/"false"
  row.setAttribute("data-scroll-anchor", anchor ? "true" : "false");
  stubRect(row, box);
  content.appendChild(row);
  return row;
}

/**
 * 加一行，并让它的视口矩形与 `scrollTop` **自洽**。
 *
 * 引擎里 `itemOffsetTop = rect.top - vpRect.top + vp.scrollTop`，
 * 其中 `vpRect.top` 固定为 0。因此一个「内容偏移 offset、高 height」的行
 * 在视口中的 top 应为 `offset - scrollTop`。手写 rect 很容易和 scrollTop 对不上，
 * 导致算出的可滚动状态与预期不符；这个 helper 把换算固定下来。
 */
export function addRowAtOffset(
  content: HTMLElement,
  id: string,
  opts: { offset: number; height: number; scrollTop: number },
  anchor = false,
): HTMLElement {
  const top = opts.offset - opts.scrollTop;
  return addRow(content, id, { top, bottom: top + opts.height }, anchor);
}

/** 让某个行元素按「内容偏移 + 当前 scrollTop」重新报告矩形（保持自洽） */
export function syncRow(
  row: HTMLElement,
  opts: { offset: number; height: number; scrollTop: number },
): void {
  const top = opts.offset - opts.scrollTop;
  stubRect(row, { top, bottom: top + opts.height, height: opts.height });
}

export function renderEngine(overrides: Partial<EngineOptions> = {}) {
  return renderHook(() =>
    useMessageScrollerEngine(() => ({ ...ENGINE_DEFAULTS, ...overrides })),
  );
}

/** 只冲刷微任务（MutationObserver 等），不推进到下一帧 */
export async function flushState(): Promise<void> {
  await vi.advanceTimersByTimeAsync(0);
}

/**
 * 推进到下一帧。
 *
 * 假定时器把 `requestAnimationFrame` 实现成 16ms 的定时器（不是 0ms），
 * 而引擎里 resize / 分帧提交 / 可见性同步都排在 rAF 上；某些路径还要
 * "观察器回调里再排一帧"（触发 → rAF#1 → handleResize → rAF#2 → 提交），
 * 因此默认推进两帧。
 */
export async function flushFrames(times = 2): Promise<void> {
  for (let index = 0; index < times; index += 1) {
    await vi.advanceTimersByTimeAsync(16);
  }
}

/** 挂载 viewport + content，并跑完一次分帧提交 */
export async function mountEngine(options: {
  overrides?: Partial<EngineOptions>;
  dom?: Parameters<typeof setupDom>[0];
}) {
  const dom = setupDom(options.dom);
  const hook = renderEngine(options.overrides);
  hook.result.setViewport(dom.viewport);
  hook.result.setContent(dom.content);
  await flushState();
  return { ...hook, ...dom };
}

/** 记录型 IntersectionObserver：捕获实例与回调，供用例手动投递 entries */
export interface ObserverStub {
  instances: Array<{
    callback: IntersectionObserverCallback;
    options: IntersectionObserverInit | undefined;
    observed: Set<Element>;
    unobserve: (el: Element) => void;
    disconnect: () => void;
    trigger: (
      entries: Array<{ target: Element; isIntersecting: boolean }>,
    ) => void;
  }>;
  /** 最近一个实例 */
  last: () => ObserverStub["instances"][number] | undefined;
}

export function stubIntersectionObserver(): ObserverStub {
  const instances: ObserverStub["instances"] = [];

  class RecordingObserver {
    observed = new Set<Element>();
    options: IntersectionObserverInit | undefined;
    constructor(
      private callback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) {
      // 记录实例，供用例断言 observe/unobserve/disconnect 与手动投递 entries
      instances.push(this as unknown as ObserverStub["instances"][number]);
      this.options = options;
    }
    observe = (el: Element) => {
      this.observed.add(el);
    };
    unobserve = (el: Element) => {
      this.observed.delete(el);
    };
    disconnect = () => {
      this.observed.clear();
    };
    takeRecords = () => [];
    trigger = (
      entries: Array<{ target: Element; isIntersecting: boolean }>,
    ) => {
      this.callback(
        entries.map(
          (entry) =>
            ({
              target: entry.target,
              isIntersecting: entry.isIntersecting,
            }) as IntersectionObserverEntry,
        ),
        this as unknown as IntersectionObserver,
      );
    };
  }

  vi.stubGlobal("IntersectionObserver", RecordingObserver);

  return {
    instances,
    last: () => instances.at(-1),
  };
}

/** 记录型 ResizeObserver：可手动触发回调，用于驱动引擎的 `handleResize` */
export interface ResizeObserverStub {
  instances: Array<{
    observed: Set<Element>;
    trigger: () => void;
    disconnect: () => void;
  }>;
  /** 触发所有实例（引擎里 content / viewport 各挂一个） */
  triggerAll: () => void;
  disconnectCalls: () => number;
}

export function stubResizeObserver(): ResizeObserverStub {
  const instances: ResizeObserverStub["instances"] = [];
  let disconnects = 0;

  class RecordingResizeObserver {
    observed = new Set<Element>();
    constructor(private callback: ResizeObserverCallback) {
      instances.push(
        this as unknown as ResizeObserverStub["instances"][number],
      );
    }
    observe = (el: Element) => {
      this.observed.add(el);
    };
    unobserve = (el: Element) => {
      this.observed.delete(el);
    };
    disconnect = () => {
      this.observed.clear();
      disconnects += 1;
    };
    trigger = () => {
      this.callback(
        [...this.observed].map((target) => ({ target }) as ResizeObserverEntry),
        this as unknown as ResizeObserver,
      );
    };
  }

  vi.stubGlobal("ResizeObserver", RecordingResizeObserver);

  return {
    instances,
    triggerAll: () => {
      for (const instance of instances) instance.trigger();
    },
    disconnectCalls: () => disconnects,
  };
}

/**
 * 假 Context：只填被测组件用到的字段，其余给安全默认值。
 *
 * 组件的渲染/ARIA/接线测试用它驱动确定性的输入（而不是依赖真实测量），
 * 整机行为另由 `message-scroller.integration.test.tsx` 覆盖真实引擎。
 */
export function fakeContext(
  overrides: Partial<MessageScrollerContextValue> = {},
): MessageScrollerContextValue {
  return {
    viewport: () => undefined,
    setViewport: () => {},
    content: () => undefined,
    setContent: () => {},
    setSpacer: () => {},
    registerItem: () => () => {},
    preserveScrollOnPrepend: () => true,
    setPreserveScrollOnPrepend: () => {},
    scrollableStart: () => false,
    scrollableEnd: () => false,
    autoscrolling: () => false,
    pendingScroll: () => false,
    scrollToStart: () => true,
    scrollToEnd: () => true,
    scrollToMessage: () => true,
    currentAnchorId: () => null,
    visibleMessageIds: () => [],
    subscribeVisibility: () => () => {},
    options: (() => ({
      autoScroll: false,
      defaultScrollPosition: "end",
      scrollEdgeThreshold: 8,
      scrollMargin: 0,
      scrollPreviousItemPeek: 64,
    })) as MessageScrollerContextValue["options"],
    ...overrides,
  };
}

/** Provider 的 wrapper（用 createComponent 以免把 JSX 带进 .ts 文件） */
export function contextWrapper(value: MessageScrollerContextValue) {
  return (props: { children: JSX.Element }) =>
    createComponent(MessageScrollerContext.Provider, {
      value,
      get children() {
        return props.children;
      },
    });
}

/** 在假 Provider 内渲染一个 hook */
export function renderInContext<T>(
  useHook: () => T,
  value: MessageScrollerContextValue,
) {
  return renderHook(useHook, { wrapper: contextWrapper(value) });
}
