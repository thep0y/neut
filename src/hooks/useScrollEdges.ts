import { createEffect, createSignal, onCleanup, type Accessor } from "solid-js";

export interface ScrollEdges {
  /** 上方是否还有未显示的内容 */
  canScrollUp: Accessor<boolean>;
  /** 下方是否还有未显示的内容 */
  canScrollDown: Accessor<boolean>;
  /** 手动刷新一次边缘状态(如打开、内容变化后) */
  refresh: () => void;
}

/** 进入/退出阈值分开(迟滞),避免在边界 1px 处反复翻转导致箭头闪动 */
const ENTER_THRESHOLD = 4;
const EXIT_THRESHOLD = 1;

/**
 * 跟踪某个滚动容器上方/下方是否还有未显示的内容，用于驱动滚动提示箭头。
 *
 * 监听 scroll(passive) + ResizeObserver(容器与首个子元素尺寸) +
 * MutationObserver(childList/subtree)，因此面板高度变化、选项增删后显隐都能及时更新。
 *
 * 显隐用**迟滞阈值**：从"无内容"变为"有内容"要超过 4px，反向要回落到 1px 以内，
 * 避免在滚动到边界时 canScroll* 每帧抖动(箭头反复出现/消失)。
 */
export function useScrollEdges(
  target: Accessor<HTMLElement | undefined>,
): ScrollEdges {
  const [canScrollUp, setCanScrollUp] = createSignal(false);
  const [canScrollDown, setCanScrollDown] = createSignal(false);

  const refresh = () => {
    const el = target();
    if (!el) {
      setCanScrollUp(false);
      setCanScrollDown(false);
      return;
    }
    const top = el.scrollTop;
    const remaining = el.scrollHeight - el.clientHeight - top;
    setCanScrollUp((prev) =>
      prev ? top > EXIT_THRESHOLD : top > ENTER_THRESHOLD,
    );
    setCanScrollDown((prev) =>
      prev ? remaining > EXIT_THRESHOLD : remaining > ENTER_THRESHOLD,
    );
  };

  createEffect(() => {
    const el = target();
    if (!el) return;

    refresh();

    const resizeObserver = new ResizeObserver(refresh);
    resizeObserver.observe(el);
    if (el.firstElementChild) resizeObserver.observe(el.firstElementChild);

    const mutationObserver = new MutationObserver(refresh);
    mutationObserver.observe(el, { childList: true, subtree: true });

    el.addEventListener("scroll", refresh, { passive: true });
    onCleanup(() => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      el.removeEventListener("scroll", refresh);
    });
  });

  return { canScrollUp, canScrollDown, refresh };
}
