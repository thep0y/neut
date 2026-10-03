import { EPSILON, type PairConstraints } from "./resizable.resize";
import type { ResizablePanelMeta } from "./resizable.types";

/**
 * Resizable 的「约束代数」。
 *
 * 单一职责：把 panel 的响应式约束（min/max/collapsible/collapsedSize）摊平成
 * 可以参与计算的数字与结构。不读信号以外的状态、不写 store、不碰 DOM，
 * 因此拖拽边界、折叠判定、归一化边界都能单独断言。
 */

/**
 * 拖拽实际能到的最小值：可折叠时是 `collapsedSize`（继续拖会吸附到折叠），
 * 否则是 `minSize`。
 */
export function effectiveMin(meta: ResizablePanelMeta): number {
  return meta.collapsible() ? meta.collapsedSize() : meta.minSize();
}

/** 尺寸是否落在「已折叠」区间（含 EPSILON 容差，避免浮点误差来回抖动） */
export function isCollapsedSize(
  meta: ResizablePanelMeta,
  size: number,
): boolean {
  return meta.collapsible() && size <= meta.collapsedSize() + EPSILON;
}

/** 全部 panel 的 `[min, max]` 边界，顺序与注册顺序一致（归一化按此顺序） */
export function constraintBounds(
  metas: readonly ResizablePanelMeta[],
): { min: number; max: number }[] {
  return metas.map((meta) => ({
    min: effectiveMin(meta),
    max: meta.maxSize(),
  }));
}

/** 把一对相邻 panel 摊平成 `resolvePairSize` 需要的约束 */
export function pairConstraintsOf(
  prev: ResizablePanelMeta,
  next: ResizablePanelMeta,
): PairConstraints {
  return {
    prevMin: effectiveMin(prev),
    prevMax: prev.maxSize(),
    prevCollapsible: prev.collapsible(),
    prevCollapsedSize: prev.collapsedSize(),
    prevFloor: prev.minSize(),
    nextMin: effectiveMin(next),
    nextMax: next.maxSize(),
    nextCollapsible: next.collapsible(),
    nextCollapsedSize: next.collapsedSize(),
    nextFloor: next.minSize(),
  };
}
