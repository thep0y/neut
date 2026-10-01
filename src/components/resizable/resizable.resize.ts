/**
 * Resizable 的相邻面板尺寸算法。
 *
 * 单一职责：给定「一对相邻面板」的约束，算出拖动后的两个尺寸。
 * 不碰 store、不读 DOM，因此 min / max / collapsible 吸附的每个分支都可独立单测。
 */

/** 浮点比较容差（对齐上游语义） */
export const EPSILON = 0.001;

/** 一对相邻面板的约束 */
export interface PairConstraints {
  /** 前一个面板拖动能到的最小值（可折叠时是 collapsedSize） */
  prevMin: number;
  prevMax: number;
  prevCollapsible: boolean;
  /** 折叠态尺寸（仅 `prevCollapsible` 时有意义） */
  prevCollapsedSize: number;
  /** 非折叠时拖动能到的最小值 */
  prevFloor: number;
  nextMin: number;
  nextMax: number;
  nextCollapsible: boolean;
  nextCollapsedSize: number;
  nextFloor: number;
}

/** 夹取 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 把目标尺寸夹到「两个面板的可行区间」内。
 * 下界取「prev 自己的最小值」与「total 减去 next 最大值」的较大者；
 * 上界取「prev 最大值」与「total 减去 next 最小值」的较小者。
 */
export function pairBounds(
  constraints: PairConstraints,
  total: number,
): { lo: number; hi: number } {
  return {
    lo: Math.max(constraints.prevMin, total - constraints.nextMax),
    hi: Math.min(constraints.prevMax, total - constraints.nextMin),
  };
}

/**
 * 折叠吸附：落在 `(collapsedSize, minSize)` 之间时贴向较近的一端。
 * 这是「拖到接近折叠位置时自动吸入折叠/展开」的体验来源。
 */
function snapToNearest(
  size: number,
  collapsedSize: number,
  minSize: number,
): number {
  const distanceToCollapsed = size - collapsedSize;
  const distanceToMin = minSize - size;
  return distanceToCollapsed < distanceToMin ? collapsedSize : minSize;
}

/**
 * 计算拖动后「前一个面板」的最终尺寸。
 *
 * 步骤：夹到可行区间 → 对 prev 做折叠吸附 → 对 next 做折叠吸附 → 再夹一次
 * （吸附可能让尺寸越界）。返回的 `next` 永远等于 `total - prev`，因此两者之和守恒。
 */
export function resolvePairSize(
  constraints: PairConstraints,
  targetPrev: number,
  total: number,
): number {
  const { lo, hi } = pairBounds(constraints, total);
  let size = clamp(targetPrev, lo, hi);

  if (
    constraints.prevCollapsible &&
    size < constraints.prevFloor - EPSILON &&
    size > constraints.prevCollapsedSize + EPSILON
  ) {
    size = snapToNearest(
      size,
      constraints.prevCollapsedSize,
      constraints.prevFloor,
    );
  }

  const rest = total - size;
  if (
    constraints.nextCollapsible &&
    rest < constraints.nextFloor - EPSILON &&
    rest > constraints.nextCollapsedSize + EPSILON
  ) {
    size =
      total -
      snapToNearest(rest, constraints.nextCollapsedSize, constraints.nextFloor);
  }

  return clamp(size, lo, hi);
}

/**
 * 计算面板的初始尺寸。
 *
 * 规则：优先用 `saved[id]`，否则用面板自己的 `defaultSize`；
 * 没有指定尺寸的面板平分剩余空间（剩余为负时按 0 分）。
 */
export function distributeInitialSizes(
  ids: string[],
  saved: Record<string, number> | undefined,
  defaults: Array<number | undefined>,
): number[] {
  const raw = ids.map((id, index) => saved?.[id] ?? defaults[index]);
  const defined = raw.filter((value): value is number => value !== undefined);
  const unknown = raw.length - defined.length;
  const used = defined.reduce((acc, value) => acc + value, 0);
  const remaining = Math.max(0, 100 - used);
  const fill = unknown > 0 ? remaining / unknown : 0;
  return raw.map((value) => value ?? fill);
}
