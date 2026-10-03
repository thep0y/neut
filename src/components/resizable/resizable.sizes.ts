import { createStore, produce } from "solid-js/store";
import { pairConstraintsOf } from "./resizable.constraints";
import type { PanelRegistry } from "./resizable.registry";
import { resolvePairSize } from "./resizable.resize";
import type { ResizablePanelMeta } from "./resizable.types";

export interface PanelSizesContext {
  /** 按 DOM 顺序排列的面板（写入时要与值的顺序对齐） */
  metas: () => ResizablePanelMeta[];
  registry: PanelRegistry;
  /** 单个面板尺寸变化的上报（onResize / onCollapse / onExpand） */
  reportSizeChange: (
    meta: ResizablePanelMeta,
    oldSize: number,
    newSize: number,
  ) => void;
}

export interface PanelSizes {
  /** 细粒度的百分比 store：只更新涉及的键，子节点不重渲染 */
  store: Record<string, number>;
  sizeOf: (id: string) => number;
  /** 按面板顺序批量写入；`report` 为 false 时（初始化）不上报 */
  applyAll: (values: number[], report?: boolean) => void;
  /** 把一对相邻面板的总量按目标值重新切分，并上报两侧变化 */
  applyPair: (
    prev: ResizablePanelMeta,
    next: ResizablePanelMeta,
    targetPrev: number,
    total: number,
  ) => void;
  /** 命令式设置单个面板，把它与相邻面板之间重新分配 */
  applyPanelTarget: (meta: ResizablePanelMeta, targetSize: number) => void;
  /** 面板卸载时删掉它的尺寸 */
  remove: (id: string) => void;
}

/**
 * 面板尺寸的账目。
 *
 * 单一职责：持有百分比 store 并承担**所有**写入——批量套用、相邻对重分配、
 * 单面板命令式调整、以及卸载清理。约束求解委托给 `resizable.resize` /
 * `resizable.constraints`，上报委托给传入的 `reportSizeChange`，
 * 读与不读 store 的判断都收在这里，调用方不再直接碰 `setStore`。
 */
export function createPanelSizes(ctx: PanelSizesContext): PanelSizes {
  const [store, setStore] = createStore<Record<string, number>>({});

  const sizeOf = (id: string) => store[id] ?? 0;

  const applyAll = (values: number[], report = true) => {
    const list = ctx.metas();
    const before = list.map((meta) => sizeOf(meta.id));
    setStore(
      produce((draft) => {
        list.forEach((meta, index) => {
          const value = values[index];
          if (value !== undefined) draft[meta.id] = value;
        });
      }),
    );
    if (!report) return;

    list.forEach((meta, index) => {
      const value = values[index];
      if (value !== undefined) {
        ctx.reportSizeChange(meta, before[index]!, value);
      }
    });
  };

  const applyPair: PanelSizes["applyPair"] = (
    prev,
    next,
    targetPrev,
    total,
  ) => {
    const size = resolvePairSize(
      pairConstraintsOf(prev, next),
      targetPrev,
      total,
    );
    const prevOld = sizeOf(prev.id);
    const nextOld = sizeOf(next.id);

    setStore(
      produce((draft) => {
        draft[prev.id] = size;
        draft[next.id] = total - size;
      }),
    );
    ctx.reportSizeChange(prev, prevOld, size);
    ctx.reportSizeChange(next, nextOld, total - size);
  };

  const applyPanelTarget: PanelSizes["applyPanelTarget"] = (
    meta,
    targetSize,
  ) => {
    const { prev, next } = ctx.registry.neighbors(meta);
    if (next) {
      applyPair(meta, next, targetSize, sizeOf(meta.id) + sizeOf(next.id));
    } else if (prev) {
      const total = sizeOf(prev.id) + sizeOf(meta.id);
      applyPair(prev, meta, total - targetSize, total);
    } else {
      // 独苗面板：没有可重分配的对象，直接占满
      setStore(meta.id, 100);
    }
  };

  const remove = (id: string) => {
    setStore(
      produce((draft) => {
        delete draft[id];
      }),
    );
  };

  return { store, sizeOf, applyAll, applyPair, applyPanelTarget, remove };
}
