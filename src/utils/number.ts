/**
 * 把数值限制到 [min, max]。两端都可缺省(缺省即不限制该侧)。
 *
 * 合并自 resizable(必填 min/max)与 number-input(可选 min/max)两份实现:
 * 后者是前者的超集,统一成可选参数后两边都能用,且避免各自维护一份边界逻辑。
 */
export function clamp(value: number, min?: number, max?: number): number {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}
