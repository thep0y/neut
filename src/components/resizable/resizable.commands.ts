import { createCollapseMemory, nextCollapseAction } from "./resizable.collapse";
import { isCollapsedSize } from "./resizable.constraints";
import type { PanelRegistry } from "./resizable.registry";
import type { PanelSizes } from "./resizable.sizes";
import type { ResizablePanelMeta } from "./resizable.types";

export interface PanelCommandsContext {
  /** 按 DOM 顺序排列的面板 */
  metas: () => ResizablePanelMeta[];
  registry: PanelRegistry;
  sizes: PanelSizes;
  /** 通知 + 持久化 */
  commit: () => void;
}

export interface PanelCommands {
  /** 折叠指定面板；不可折叠或已折叠时返回 false */
  collapsePanel: (id: string) => boolean;
  /** 展开指定面板（回到折叠前的尺寸，但不小于 minSize）；不可展开时返回 false */
  expandPanel: (id: string) => boolean;
  /** 命令式设置尺寸 */
  setPanelSize: (id: string, size: number) => void;
  /** 该面板当前是否处于折叠态 */
  isPanelCollapsed: (id: string) => boolean;
  /** 按分隔条解析出的相邻对，折叠或展开其中的可折叠面板 */
  toggleHandleCollapse: (handleEl: HTMLElement) => void;
}

/**
 * 面板的命令式尺寸操作（collapse / expand / setSize / 键盘切换）。
 *
 * 单一职责：把"命令"翻译成一次 `PanelSizes` 写入 + 一次 `commit`，
 * 并维护"折叠前的尺寸"这份记忆（`resizable.collapse`）。
 * 决策（该折还是该展）也来自 `resizable.collapse.nextCollapseAction`，
 * 这里只负责执行与前后置校验。
 */
export function createPanelCommands(ctx: PanelCommandsContext): PanelCommands {
  const collapsedMemory = createCollapseMemory();

  const findMeta = (id: string) =>
    ctx.metas().find((item) => item.id === id) ?? null;

  const collapsePanel = (id: string) => {
    const meta = findMeta(id);
    if (!meta?.collapsible()) return false;

    const current = ctx.sizes.sizeOf(id);
    if (isCollapsedSize(meta, current)) return false;

    // 记下折叠前的尺寸，展开时回到这里（而不是 minSize）
    collapsedMemory.remember(id, current);
    ctx.sizes.applyPanelTarget(meta, meta.collapsedSize());
    ctx.commit();
    return true;
  };

  const expandPanel = (id: string) => {
    const meta = findMeta(id);
    if (!meta?.collapsible()) return false;

    const current = ctx.sizes.sizeOf(id);
    if (!isCollapsedSize(meta, current)) return false;

    const remembered = collapsedMemory.recall(id, meta.minSize());
    ctx.sizes.applyPanelTarget(meta, Math.max(remembered, meta.minSize()));
    ctx.commit();
    return true;
  };

  const setPanelSize = (id: string, size: number) => {
    const meta = findMeta(id);
    if (!meta) return;
    ctx.sizes.applyPanelTarget(meta, size);
    ctx.commit();
  };

  const isPanelCollapsed = (id: string) => {
    const meta = findMeta(id);
    return meta ? isCollapsedSize(meta, ctx.sizes.sizeOf(id)) : false;
  };

  const toggleHandleCollapse = (handleEl: HTMLElement) => {
    const adjacent = ctx.registry.adjacent(handleEl, ctx.sizes.sizeOf);
    if (!adjacent) return;

    const decision = nextCollapseAction(adjacent, ctx.sizes.sizeOf);
    if (!decision) return;

    if (decision.action === "expand") expandPanel(decision.id);
    else collapsePanel(decision.id);
  };

  return {
    collapsePanel,
    expandPanel,
    setPanelSize,
    isPanelCollapsed,
    toggleHandleCollapse,
  };
}
