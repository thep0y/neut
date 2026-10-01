import { clamp } from "~/utils";

/** 解析尺寸:number/`"25%"`/`"25"` 都按百分比处理(不支持 px,按需再扩展) */
export function parseSize(
  value: number | string | undefined,
  fallback: number,
): number {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  const trimmed = value.trim();
  const numeric = Number.parseFloat(trimmed);
  return Number.isFinite(numeric) ? numeric : fallback;
}

/** 百分比保留 2 位小数,避免 onLayoutChange/layout 输出出现长尾浮点 */
export function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * 把一组原始权重归一化到总和 100,并在迭代中尊重每个面板的上下界。
 * 之所以不用简单的按比例缩放:min/max 会在缩放后再次越界,需要固定越界项、
 * 把剩余空间按权重分给其余项(最多 4 轮即可收敛)。
 */
export function normalizeSizes(
  raw: number[],
  bounds: Array<{ min: number; max: number }>,
): number[] {
  if (raw.length === 0) return [];
  const result = raw.map((value, index) =>
    clamp(value, bounds[index]!.min, bounds[index]!.max),
  );
  const sum = result.reduce((acc, value) => acc + value, 0);
  if (sum <= 0) {
    const equal = 100 / raw.length;
    return raw.map(() => equal);
  }
  for (let index = 0; index < result.length; index += 1) {
    result[index] = (result[index]! * 100) / sum;
  }

  for (let iteration = 0; iteration < 4; iteration += 1) {
    let fixedSum = 0;
    const free: number[] = [];
    for (let index = 0; index < result.length; index += 1) {
      const bound = bounds[index]!;
      if (result[index]! > bound.max) {
        result[index] = bound.max;
        fixedSum += bound.max;
      } else if (result[index]! < bound.min) {
        result[index] = bound.min;
        fixedSum += bound.min;
      } else {
        free.push(index);
      }
    }
    if (free.length === 0) break;
    const target = 100 - fixedSum;
    const freeSum = free.reduce((acc, index) => acc + result[index]!, 0);
    if (freeSum <= 0) {
      const equal = target / free.length;
      for (const index of free) result[index] = equal;
      break;
    }
    for (const index of free) {
      result[index] = (result[index]! * target) / freeSum;
    }
  }
  return result;
}
