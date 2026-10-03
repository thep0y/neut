import type { ResizablePanelMeta } from "./resizable.types";

export interface AdjacentPanels {
  prev: ResizablePanelMeta;
  next: ResizablePanelMeta;
  /** 前一个面板的当前尺寸 */
  prevSize: number;
  /** 相邻两者尺寸之和（拖拽时保持不变的部分） */
  total: number;
}

export interface PanelRegistry {
  /** 注册面板：注册顺序即渲染顺序 */
  add(meta: ResizablePanelMeta): void;
  remove(meta: ResizablePanelMeta): void;
  /** 已注册面板，按注册顺序（跳过已卸载的空位） */
  ordered(): ResizablePanelMeta[];
  /** 句柄两侧最近的已注册面板，中间的非面板节点（如把手装饰）会被跳过 */
  adjacent(
    handleEl: HTMLElement,
    getSize: (id: string) => number,
  ): AdjacentPanels | undefined;
  /** 某个面板在注册顺序里的前后邻居 */
  neighbors(meta: ResizablePanelMeta): {
    prev: ResizablePanelMeta | undefined;
    next: ResizablePanelMeta | undefined;
  };
}

/**
 * Resizable 的面板注册表。
 *
 * 单一职责：维护「元素 → meta」与「注册顺序」，并据此解析相邻关系。
 * 它不持有尺寸（尺寸通过 `getSize` 注入）、不写 store、不触发回调，
 * 因此相邻解析可以脱离布局引擎直接断言。
 */
export function createPanelRegistry(): PanelRegistry {
  const metas = new Map<HTMLElement, ResizablePanelMeta>();
  let order: HTMLElement[] = [];

  const ordered = (): ResizablePanelMeta[] =>
    order
      .map((element) => metas.get(element))
      .filter((meta): meta is ResizablePanelMeta => !!meta);

  return {
    add(meta) {
      metas.set(meta.element, meta);
      order = [...order, meta.element];
    },
    remove(meta) {
      metas.delete(meta.element);
      order = order.filter((element) => element !== meta.element);
    },
    ordered,
    adjacent(handleEl, getSize) {
      let prevEl = handleEl.previousElementSibling as HTMLElement | null;
      while (prevEl && !metas.has(prevEl)) {
        prevEl = prevEl.previousElementSibling as HTMLElement | null;
      }
      let nextEl = handleEl.nextElementSibling as HTMLElement | null;
      while (nextEl && !metas.has(nextEl)) {
        nextEl = nextEl.nextElementSibling as HTMLElement | null;
      }
      if (!prevEl || !nextEl) return undefined;

      // 循环只在「已注册」的元素上停下，因此这里必然命中
      const prev = metas.get(prevEl)!;
      const next = metas.get(nextEl)!;

      const prevSize = getSize(prev.id);
      const nextSize = getSize(next.id);
      return { prev, next, prevSize, total: prevSize + nextSize };
    },
    neighbors(meta) {
      const index = order.indexOf(meta.element);
      const nextElement = order[index + 1];
      const prevElement = order[index - 1];
      return {
        prev: prevElement ? metas.get(prevElement) : undefined,
        next: nextElement ? metas.get(nextElement) : undefined,
      };
    },
  };
}
