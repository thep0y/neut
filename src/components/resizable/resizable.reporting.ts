import { isCollapsedSize } from "./resizable.constraints";
import {
  persistLayout,
  readSavedLayout,
  type PersistContext,
} from "./resizable.storage";
import type { ResizableLayout, ResizablePanelMeta } from "./resizable.types";
import { roundPercent } from "./resizable.utils";

export interface LayoutReportingContext {
  /** 按 DOM 顺序排列的面板元数据 */
  metas: () => readonly ResizablePanelMeta[];
  /** 读取某个面板当前的百分比尺寸 */
  sizeOf: (id: string) => number;
  /** 布局变化回调（拖拽的每一帧都会调用） */
  onLayoutChange: (layout: ResizableLayout) => void;
  /** 持久化上下文（autoSaveId + storage） */
  persist: () => PersistContext;
}

export interface LayoutReporting {
  /** 把 store 里的尺寸整理成对外的布局快照 */
  snapshot: () => ResizableLayout;
  /** 只通知布局变化，不写 storage（拖拽的每一帧） */
  notify: () => void;
  /** 通知 + 持久化（离散操作与拖拽结束） */
  commit: () => void;
  /** 读回已保存的布局 */
  readSaved: () => ResizableLayout | undefined;
  /**
   * 上报单个面板的尺寸变化：
   * 始终回调 `onResize`；可折叠面板还会在"折叠 ⇄ 展开"越过阈值时报 `onCollapse` /
   * `onExpand`，普通尺寸变化不触发这两个回调。
   */
  reportSizeChange: (
    meta: ResizablePanelMeta,
    oldSize: number,
    newSize: number,
  ) => void;
}

/**
 * 布局的对外汇报与持久化。
 *
 * 单一职责：把内部的百分比 store 翻译成对外的 `onLayoutChange` 回调、
 * 尺寸/折叠/展开的通知，以及 `autoSaveId` 驱动的持久化。
 * 不写 store、不做约束求解——只管"告诉外面发生了什么"。
 */
export function createLayoutReporting(
  ctx: LayoutReportingContext,
): LayoutReporting {
  const snapshot = (): ResizableLayout => {
    const result: ResizableLayout = {};
    for (const meta of ctx.metas()) {
      result[meta.id] = roundPercent(ctx.sizeOf(meta.id));
    }
    return result;
  };

  return {
    snapshot,
    notify() {
      ctx.onLayoutChange(snapshot());
    },
    commit() {
      const next = snapshot();
      ctx.onLayoutChange(next);
      persistLayout(ctx.persist(), next);
    },
    readSaved() {
      return readSavedLayout(ctx.persist());
    },
    reportSizeChange(meta, oldSize, newSize) {
      meta.onResize?.(roundPercent(newSize));
      if (!meta.collapsible()) return;

      const was = isCollapsedSize(meta, oldSize);
      const now = isCollapsedSize(meta, newSize);
      if (!was && now) meta.onCollapse?.();
      else if (was && !now) meta.onExpand?.();
    },
  };
}
