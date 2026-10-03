import type { JSX } from "solid-js";
import { clamp, toKebabCase } from "~/utils";

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

/**
 * 面板的 `style` 文本：`flex-grow` 承载百分比尺寸，配 `flex-shrink/basis`
 * 保证面板只按权重分配主轴空间。
 *
 * 用字符串而非对象声明 style，是因为模板字面量会被 Solid 包进 effect，
 * 尺寸变化时能可靠更新；对象形式里的 getter 不保证被编译器识别为动态。
 * 调用方传入的 style 支持字符串原样拼接或对象（键转 kebab-case，空值跳过）。
 */
export function buildPanelStyleText(
  size: number,
  style?: string | JSX.CSSProperties,
): string {
  const parts = [`flex-grow:${size}`, "flex-shrink:1", "flex-basis:0%"];
  if (typeof style === "string") {
    parts.push(style);
    return parts.join(";");
  }
  if (style && typeof style === "object") {
    for (const [key, value] of Object.entries(style)) {
      if (value === null || value === undefined) continue;
      parts.push(`${toKebabCase(key)}:${value}`);
    }
  }
  return parts.join(";");
}
