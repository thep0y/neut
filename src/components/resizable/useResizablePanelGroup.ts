import { createSignal, type Accessor } from "solid-js";
import { createStore, produce } from "solid-js/store";
import type { ResizablePanelGroupContextValue } from "./resizable.context";
import type {
  ResizableLayout,
  ResizableOrientation,
  ResizablePanelMeta,
} from "./resizable.types";
import { distributeInitialSizes, resolvePairSize } from "./resizable.resize";
import {
  constraintBounds,
  effectiveMin,
  isCollapsedSize,
  pairConstraintsOf,
} from "./resizable.constraints";
import {
  persistLayout,
  readSavedLayout,
  type PersistContext,
} from "./resizable.storage";
import { normalizeSizes, roundPercent } from "./resizable.utils";

interface Options {
  orientation: Accessor<ResizableOrientation>;
  defaultLayout: Accessor<ResizableLayout | undefined>;
  onLayoutChange: (layout: ResizableLayout) => void;
  autoSaveId: Accessor<string | undefined>;
  storage: Accessor<Storage | undefined>;
  keyboardResizeBy: Accessor<number>;
}

/**
 * Resizable 的布局引擎(对齐 react-resizable-panels v4 的核心语义,但按 Solid 重写):
 * - 尺寸用**百分比权重**存在 store 里,渲染时映射为 `flex-grow`,拖拽只更新相邻两个
 *   panel 的两个键,子节点不重渲染(细粒度更新);
 * - panel 在挂载时注册(顺序即 DOM 顺序),handle 通过相邻兄弟节点解析前后 panel;
 * - 约束/min/max/collapsible 吸附、归一化到 100、以及命令式 collapse/expand;
 * - 拖拽用 pointer capture,pointermove 由调用方用 rAF 合并,避免高频写 store;
 * - autoSaveId + storage 做布局持久化。
 */
export function useResizablePanelGroup(
  options: Options,
): ResizablePanelGroupContextValue {
  const [groupElement, setGroupElement] = createSignal<HTMLElement>();
  const [dragging, setDragging] = createSignal(false);
  const [store, setStore] = createStore<Record<string, number>>({});

  const metas = new Map<HTMLElement, ResizablePanelMeta>();
  let order: HTMLElement[] = [];
  let initialized = false;
  const collapsedMemory = new Map<string, number>();

  const orderedMetas = (): ResizablePanelMeta[] =>
    order
      .map((element) => metas.get(element))
      .filter((meta): meta is ResizablePanelMeta => !!meta);

  const persistContext = (): PersistContext => ({
    autoSaveId: options.autoSaveId(),
    storage: options.storage(),
  });

  const layout = (): ResizableLayout => {
    const result: ResizableLayout = {};
    for (const meta of orderedMetas()) {
      result[meta.id] = roundPercent(store[meta.id] ?? 0);
    }
    return result;
  };

  /** 只通知布局变化（拖拽的每一帧），不写 storage */
  const notify = () => options.onLayoutChange(layout());

  /** 通知 + 持久化（离散操作与拖拽结束） */
  const commit = () => {
    const next = layout();
    options.onLayoutChange(next);
    persistLayout(persistContext(), next);
  };

  const readSaved = (): ResizableLayout | undefined =>
    readSavedLayout(persistContext());

  const bounds = () => constraintBounds(orderedMetas());

  const reportResize = (
    meta: ResizablePanelMeta,
    oldSize: number,
    newSize: number,
  ) => {
    meta.onResize?.(roundPercent(newSize));
    if (!meta.collapsible()) return;
    const was = isCollapsedSize(meta, oldSize);
    const now = isCollapsedSize(meta, newSize);
    if (!was && now) meta.onCollapse?.();
    else if (was && !now) meta.onExpand?.();
  };

  const applySizes = (values: number[], report = true) => {
    const list = orderedMetas();
    const before = list.map((meta) => store[meta.id] ?? 0);
    setStore(
      produce((draft) => {
        list.forEach((meta, index) => {
          const value = values[index];
          if (value !== undefined) draft[meta.id] = value;
        });
      }),
    );
    if (report) {
      list.forEach((meta, index) => {
        const value = values[index];
        if (value !== undefined) reportResize(meta, before[index]!, value);
      });
    }
  };

  const buildInitial = (): number[] => {
    const list = orderedMetas();
    const saved = readSaved() ?? options.defaultLayout();
    return distributeInitialSizes(
      list.map((meta) => meta.id),
      saved,
      list.map((meta) => meta.defaultSize),
    );
  };

  const initialize = () => {
    if (initialized) return;
    // SSR 不计算布局:首屏由 Panel 的 defaultSize fallback 撑起,客户端再归一化
    if (typeof window === "undefined") return;
    const list = orderedMetas();
    if (list.length === 0) return;
    initialized = true;
    applySizes(normalizeSizes(buildInitial(), bounds()), false);
    commit();
  };

  const scheduleInitialize = () => {
    if (typeof window === "undefined") return;
    queueMicrotask(() => {
      if (!initialized) initialize();
    });
  };

  const registerPanel = (meta: ResizablePanelMeta) => {
    metas.set(meta.element, meta);
    order = [...order, meta.element];
    if (!initialized) {
      scheduleInitialize();
    } else if (store[meta.id] === undefined) {
      // 动态新增:给它默认尺寸,并把其它面板等比压回 100
      const list = orderedMetas();
      const raw = list.map((item) =>
        item.id === meta.id
          ? (item.defaultSize ?? 100 / list.length)
          : (store[item.id] ?? 0),
      );
      applySizes(normalizeSizes(raw, bounds()));
      commit();
    }
    return () => {
      metas.delete(meta.element);
      order = order.filter((element) => element !== meta.element);
      setStore(
        produce((draft) => {
          delete draft[meta.id];
        }),
      );
    };
  };

  const adjacentOf = (handleEl: HTMLElement) => {
    let prevEl = handleEl.previousElementSibling as HTMLElement | null;
    while (prevEl && !metas.has(prevEl)) {
      prevEl = prevEl.previousElementSibling as HTMLElement | null;
    }
    let nextEl = handleEl.nextElementSibling as HTMLElement | null;
    while (nextEl && !metas.has(nextEl)) {
      nextEl = nextEl.nextElementSibling as HTMLElement | null;
    }
    if (!prevEl || !nextEl) return undefined;
    const prev = metas.get(prevEl)!;
    const next = metas.get(nextEl)!;
    const prevSize = store[prev.id] ?? 0;
    const nextSize = store[next.id] ?? 0;
    return { prev, next, prevSize, total: prevSize + nextSize };
  };

  /** 把一对相邻面板的尺寸更新进 store，并上报各自的 resize / collapse 变化 */
  const applyPair = (
    prev: ResizablePanelMeta,
    next: ResizablePanelMeta,
    targetPrev: number,
    total: number,
  ) => {
    const size = resolvePairSize(
      pairConstraintsOf(prev, next),
      targetPrev,
      total,
    );

    const prevOld = store[prev.id] ?? 0;
    const nextOld = store[next.id] ?? 0;
    setStore(
      produce((draft) => {
        draft[prev.id] = size;
        draft[next.id] = total - size;
      }),
    );
    reportResize(prev, prevOld, size);
    reportResize(next, nextOld, total - size);
  };

  const setAdjacentSize = (handleEl: HTMLElement, targetPrevSize: number) => {
    const adjacent = adjacentOf(handleEl);
    if (!adjacent) return;
    applyPair(adjacent.prev, adjacent.next, targetPrevSize, adjacent.total);
    // 拖拽帧只通知,持久化留到 pointerup 的 commitLayout
    notify();
  };

  const nudgeAdjacent = (handleEl: HTMLElement, deltaPercent: number) => {
    const adjacent = adjacentOf(handleEl);
    if (!adjacent) return;
    applyPair(
      adjacent.prev,
      adjacent.next,
      adjacent.prevSize + deltaPercent,
      adjacent.total,
    );
    commit();
  };

  const collapsePanel = (id: string) => {
    const meta = orderedMetas().find((item) => item.id === id);
    if (!meta?.collapsible()) return false;
    const current = store[id] ?? 0;
    if (isCollapsedSize(meta, current)) return false;
    collapsedMemory.set(id, current);
    applyPanelTarget(meta, meta.collapsedSize());
    commit();
    return true;
  };

  const expandPanel = (id: string) => {
    const meta = orderedMetas().find((item) => item.id === id);
    if (!meta?.collapsible()) return false;
    const current = store[id] ?? 0;
    if (!isCollapsedSize(meta, current)) return false;
    const remembered = collapsedMemory.get(id) ?? meta.minSize();
    applyPanelTarget(meta, Math.max(remembered, meta.minSize()));
    commit();
    return true;
  };

  /** 命令式设置单个 panel,并把它与相邻 panel 之间重新分配 */
  const applyPanelTarget = (meta: ResizablePanelMeta, targetSize: number) => {
    const index = order.indexOf(meta.element);
    const nextElement = order[index + 1];
    const prevElement = order[index - 1];
    const nextMeta = nextElement ? metas.get(nextElement) : undefined;
    const prevMeta = prevElement ? metas.get(prevElement) : undefined;
    if (nextMeta) {
      const total = (store[meta.id] ?? 0) + (store[nextMeta.id] ?? 0);
      applyPair(meta, nextMeta, targetSize, total);
    } else if (prevMeta) {
      const total = (store[prevMeta.id] ?? 0) + (store[meta.id] ?? 0);
      applyPair(prevMeta, meta, total - targetSize, total);
    } else {
      setStore(meta.id, 100);
    }
  };

  const setPanelSize = (id: string, size: number) => {
    const meta = orderedMetas().find((item) => item.id === id);
    if (!meta) return;
    applyPanelTarget(meta, size);
    commit();
  };

  const toggleHandleCollapse = (handleEl: HTMLElement) => {
    const adjacent = adjacentOf(handleEl);
    if (!adjacent) return;
    const { prev, next } = adjacent;
    if (prev.collapsible()) {
      if (isCollapsedSize(prev, store[prev.id] ?? 0)) {
        expandPanel(prev.id);
      } else {
        collapsePanel(prev.id);
      }
      return;
    }
    if (next.collapsible()) {
      if (isCollapsedSize(next, store[next.id] ?? 0)) {
        expandPanel(next.id);
      } else {
        collapsePanel(next.id);
      }
      return;
    }
  };

  const groupSizePx = () => {
    const element = groupElement();
    if (!element) return 0;
    return options.orientation() === "horizontal"
      ? element.clientWidth
      : element.clientHeight;
  };

  const isRtl = () => {
    const element = groupElement();
    if (!element) return false;
    return window.getComputedStyle(element).direction === "rtl";
  };

  return {
    orientation: options.orientation,
    sizes: () => store,
    groupElement,
    setGroupElement,
    dragging,
    keyboardResizeBy: options.keyboardResizeBy,
    registerPanel,
    resolveAdjacent: (handleEl) => adjacentOf(handleEl),
    setAdjacentSize,
    nudgeAdjacent,
    toggleHandleCollapse,
    groupSizePx,
    isRtl,
    beginDrag: () => setDragging(true),
    endDrag: () => setDragging(false),
    commitLayout: commit,
    setPanelSize,
    collapsePanel,
    expandPanel,
    isPanelCollapsed: (id) => {
      const meta = orderedMetas().find((item) => item.id === id);
      return meta ? isCollapsedSize(meta, store[id] ?? 0) : false;
    },
    getPanelSize: (id) => store[id] ?? 0,
  };
}
