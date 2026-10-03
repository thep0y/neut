import { createSignal, type Accessor } from "solid-js";
import type { ResizablePanelGroupContextValue } from "./resizable.context";
import type {
  ResizableLayout,
  ResizableOrientation,
  ResizablePanelMeta,
} from "./resizable.types";
import { createPanelCommands } from "./resizable.commands";
import { createPanelLifecycle } from "./resizable.lifecycle";
import { createPanelRegistry } from "./resizable.registry";
import { createLayoutReporting } from "./resizable.reporting";
import { createPanelSizes } from "./resizable.sizes";

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
  const registry = createPanelRegistry();
  // 注册表变化本身不是响应式的，但 resolveAdjacent 的消费方（Handle 的 aria 值）
  // 需要「面板挂载/卸载后重算」。这个版本号就是那条依赖边。
  const [registryVersion, setRegistryVersion] = createSignal(0);

  const orderedMetas = (): ResizablePanelMeta[] => registry.ordered();

  const sizes = createPanelSizes({
    metas: orderedMetas,
    registry,
    reportSizeChange: (meta, oldSize, newSize) =>
      reporting.reportSizeChange(meta, oldSize, newSize),
  });
  const { store, sizeOf, applyPair } = sizes;

  const reporting = createLayoutReporting({
    metas: orderedMetas,
    sizeOf,
    onLayoutChange: options.onLayoutChange,
    persist: () => ({
      autoSaveId: options.autoSaveId(),
      storage: options.storage(),
    }),
  });
  const { notify, commit, readSaved } = reporting;

  const lifecycle = createPanelLifecycle({
    metas: orderedMetas,
    registry,
    sizes,
    readSaved,
    defaultLayout: options.defaultLayout,
    commit,
    onRegistryChange: () => setRegistryVersion((version) => version + 1),
  });
  const registerPanel = lifecycle.registerPanel;

  const adjacentOf = (handleEl: HTMLElement) =>
    registry.adjacent(handleEl, sizeOf);

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

  const commands = createPanelCommands({
    metas: orderedMetas,
    registry,
    sizes,
    commit,
  });
  const {
    collapsePanel,
    expandPanel,
    setPanelSize,
    isPanelCollapsed,
    toggleHandleCollapse,
  } = commands;

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
    resolveAdjacent: (handleEl) => {
      // 读取版本号：面板挂载/卸载后让消费方（如 aria-valuenow）重算
      registryVersion();
      return adjacentOf(handleEl);
    },
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
    isPanelCollapsed,
    getPanelSize: sizeOf,
  };
}
