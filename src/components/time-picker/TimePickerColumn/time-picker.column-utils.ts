/**
 * TimePickerColumn 的纯交互逻辑：选项索引的环形推进、跨列推进（含 RTL 取反）、
 * 以及按键到意图的映射。
 *
 * 单一职责：只做"从当前状态推出下一个状态"的计算与"按键代表什么意图"的翻译，
 * 不读信号、不写值、不碰 DOM——写回与聚焦由 hook 按返回的意图执行。
 */

/** 按键意图：move/moveColumn 是推进，commitBoundary 跳到两端，consume 只吞掉按键 */
export type ColumnKeyAction =
  | { type: "move"; direction: 1 | -1 }
  | { type: "moveColumn"; direction: 1 | -1 }
  | { type: "commitBoundary"; boundary: "first" | "last" }
  | { type: "consume" }
  | null;

/**
 * 列表内部的环形推进：
 * - 空列表返回 -1（调用方据此放弃）；
 * - 当前值不在列表里（例如 minuteStep=15 而值的分钟是 7）时，向前从 0、向后从末尾开始；
 * - 其余情况按方向环形回绕。
 */
export function resolveNextOptionIndex(
  currentIndex: number,
  direction: 1 | -1,
  length: number,
): number {
  if (length <= 0) return -1;
  if (currentIndex === -1) return direction === 1 ? 0 : length - 1;
  return (currentIndex + direction + length) % length;
}

/**
 * 跨列推进：按 `units` 顺序环形移动；RTL 下左右方向语义取反。
 * 当前列不在列表中、或目标列不存在时返回 undefined。
 */
export function resolveNextUnit<T extends string>(
  units: readonly T[],
  current: T,
  direction: 1 | -1,
  rtl: boolean,
): T | undefined {
  const index = units.indexOf(current);
  if (index === -1) return undefined;
  const step = rtl ? -direction : direction;
  return units[(index + step + units.length) % units.length];
}

/** 方向键/Home/End/Enter 映射成意图；其余按键返回 null（调用方不处理） */
export function resolveColumnKeyAction(key: string): ColumnKeyAction {
  switch (key) {
    case "ArrowDown":
      return { type: "move", direction: 1 };
    case "ArrowUp":
      return { type: "move", direction: -1 };
    case "ArrowRight":
      return { type: "moveColumn", direction: 1 };
    case "ArrowLeft":
      return { type: "moveColumn", direction: -1 };
    case "Home":
      return { type: "commitBoundary", boundary: "first" };
    case "End":
      return { type: "commitBoundary", boundary: "last" };
    case "Enter":
    case " ":
      // 移动即提交，这里只需阻止空格滚动页面
      return { type: "consume" };
    default:
      return null;
  }
}
