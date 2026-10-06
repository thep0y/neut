import { type Accessor, createSignal, onCleanup, onMount } from "solid-js";
import type { ScrollMetrics } from "./ScrollArea.types";
import { computeMetrics } from "./ScrollArea.utils";

const EMPTY_METRICS: ScrollMetrics = {
  thumbRatio: 1,
  thumbOffset: 0,
  scrollable: false,
};

export interface ScrollAreaMetrics {
  vertical: Accessor<ScrollMetrics>;
  horizontal: Accessor<ScrollMetrics>;
  /** 视口元素访问器（供 ScrollBar 读写滚动位置） */
  viewportRef: () => HTMLDivElement | undefined;
  /** 传给视口的 `ref`：绑定监听与观察器 */
  setup: (el: HTMLDivElement) => void;
}

/**
 * 视口（viewport）的滚动指标采集。
 *
 * 单一职责：监听视口的 `scroll` 与尺寸变化（`ResizeObserver` 同时观察视口与
 * 其内容元素），把尺寸换算成 `ScrollMetrics`。不关心渲染与交互。
 *
 * 注意：内容元素必须等 Solid 挂载完成后才能拿到——`ref` 回调执行时子节点
 * 尚未插入（Solid 延迟创建 children），此时读 `firstElementChild` 会拿到一个
 * 随后被替换掉的占位节点，导致内容尺寸变化永远不触发刷新。因此这里在
 * `onMount` 里才去观察内容元素。
 */
export function useScrollAreaMetrics(): ScrollAreaMetrics {
  const [vertical, setVertical] = createSignal<ScrollMetrics>(EMPTY_METRICS);
  const [horizontal, setHorizontal] =
    createSignal<ScrollMetrics>(EMPTY_METRICS);

  let viewport: HTMLDivElement | undefined;
  let content: Element | null = null;
  let observer: ResizeObserver | null = null;
  let mutations: MutationObserver | null = null;

  const measure = () => {
    if (!viewport) return;
    setVertical(
      computeMetrics(
        viewport.clientHeight,
        viewport.scrollTop,
        viewport.scrollHeight,
      ),
    );
    setHorizontal(
      computeMetrics(
        viewport.clientWidth,
        viewport.scrollLeft,
        viewport.scrollWidth,
      ),
    );
  };

  const observeContent = () => {
    const next = viewport?.firstElementChild ?? null;
    if (!observer || next === content) return;
    if (content) observer.unobserve(content);
    content = next;
    if (content) observer.observe(content);
  };

  const setup = (el: HTMLDivElement) => {
    viewport = el;
    measure();

    observer?.disconnect();
    observer = new ResizeObserver(() => measure());
    observer.observe(el);
    content = null;
    // 内容还没挂载，先不观察；onMount 时再观察真实的内容元素
    observeContent();

    el.addEventListener("scroll", measure, { passive: true });

    // 内容元素可能被替换（动态 children、spacer 增删），
    // 变化后重新指向真正的内容元素，否则它的大小变化不会触发刷新
    if (typeof MutationObserver !== "undefined") {
      mutations = new MutationObserver(() => {
        observeContent();
        measure();
      });
      mutations.observe(el, { childList: true });
    }
  };

  // 注意：cleanup 必须注册在 hook 作用域，不能写进 ref 回调里——
  // ref 回调执行时 owner 已经脱离，`onCleanup` 注册的清理函数永远不会被调用，
  // 结果就是 ResizeObserver 与 scroll 监听泄漏。
  onCleanup(() => {
    observer?.disconnect();
    observer = null;
    mutations?.disconnect();
    mutations = null;
    content = null;
    viewport?.removeEventListener("scroll", measure);
    viewport = undefined;
  });

  onMount(() => {
    observeContent();
    measure();
  });

  return { vertical, horizontal, viewportRef: () => viewport, setup };
}
