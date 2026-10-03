/**
 * Resizable 分隔条的键盘调整。
 *
 * 单一职责：把按键翻译成"调整相邻面板"的动作。方向键按 `stepPercent` 微调，
 * Home/End 推到两端，Enter/Space 切换相邻可折叠面板；其余按键原样放行。
 *
 * 不持有拖拽状态、不读 DOM 尺寸——`stepPercent`（一次按键移动多少百分比）
 * 与 `rtl`（横向且书写方向为 RTL 时方向取反）都由调用方先算好。
 */
export interface ResizableHandleKeysContext {
  /** 一次按键移动的百分比（已按 keyboardResizeBy / 主轴尺寸换算） */
  stepPercent: number;
  /** 横向且 RTL：左右方向语义取反 */
  rtl: boolean;
  /** 解析句柄两侧的面板（没有相邻对时 Home/End 不动作） */
  resolveAdjacent: (handle: HTMLElement) => { total: number } | undefined;
  nudgeAdjacent: (handle: HTMLElement, deltaPercent: number) => void;
  setAdjacentSize: (handle: HTMLElement, targetPrevSize: number) => void;
  commitLayout: () => void;
  toggleHandleCollapse: (handle: HTMLElement) => void;
}

export function handleResizableHandleKeyDown(
  event: KeyboardEvent,
  handle: HTMLElement,
  ctx: ResizableHandleKeysContext,
): void {
  const { stepPercent: step, rtl } = ctx;
  let handled = true;

  switch (event.key) {
    case "ArrowLeft":
      ctx.nudgeAdjacent(handle, rtl ? step : -step);
      break;
    case "ArrowRight":
      ctx.nudgeAdjacent(handle, rtl ? -step : step);
      break;
    case "ArrowUp":
      ctx.nudgeAdjacent(handle, -step);
      break;
    case "ArrowDown":
      ctx.nudgeAdjacent(handle, step);
      break;
    case "Home": {
      const adjacent = ctx.resolveAdjacent(handle);
      if (adjacent) {
        ctx.setAdjacentSize(handle, 0);
        ctx.commitLayout();
      }
      break;
    }
    case "End": {
      const adjacent = ctx.resolveAdjacent(handle);
      if (adjacent) {
        ctx.setAdjacentSize(handle, adjacent.total);
        ctx.commitLayout();
      }
      break;
    }
    case "Enter":
    case " ":
      ctx.toggleHandleCollapse(handle);
      break;
    default:
      handled = false;
  }

  if (handled) event.preventDefault();
}
