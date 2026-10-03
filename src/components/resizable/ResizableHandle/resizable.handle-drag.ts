import type { ResizableOrientation } from "../resizable.types";

export interface HandleDragContext {
  orientation: () => ResizableOrientation;
  isRtl: () => boolean;
  /** 沿主轴的可拖拽长度（px），用于 px → % 换算 */
  groupSizePx: () => number;
  resolveAdjacent: (
    handle: HTMLElement,
  ) => { prevSize: number; total: number } | undefined;
  setAdjacentSize: (handle: HTMLElement, targetPrevSize: number) => void;
  beginDrag: () => void;
  endDrag: () => void;
  commitLayout: () => void;
}

export interface HandleDragOptions {
  disabled: () => boolean;
  onDragging?: (dragging: boolean) => void;
}

export interface HandleDragHandlers {
  onPointerDown: (event: PointerEvent) => void;
  onPointerMove: (event: PointerEvent) => void;
  onPointerUp: (event: PointerEvent) => void;
  /** 卸载时调用：取消尚未落地的帧 */
  dispose: () => void;
}

interface DragState {
  pointerId: number;
  handle: HTMLElement;
  startCoordinate: number;
  startPrevSize: number;
  frame: number | null;
  pending: number | null;
}

/**
 * 分隔条的一次拖拽生命周期。
 *
 * 单一职责：从 pointerdown 建立拖拽会话，pointermove 把位移换算成百分比、
 * 用 `requestAnimationFrame` 合并成每帧一次写入，pointerup 结算并提交布局。
 *
 * - pointer capture 保证指针移出元素后仍能继续拖拽；
 * - px → % 用 group 主轴尺寸换算（为 0 时按 1px 兜底），横向在 RTL 下取反；
 * - 与布局引擎的交互全部通过 `ctx` 注入，因此可以脱离引擎单独驱动。
 */
export function createHandleDrag(
  ctx: HandleDragContext,
  options: HandleDragOptions,
): HandleDragHandlers {
  let drag: DragState | undefined;

  const axisCoordinate = (event: PointerEvent) =>
    ctx.orientation() === "horizontal" ? event.clientX : event.clientY;

  /** 横向 RTL 时位移方向取反（纵向始终正向） */
  const dragSign = () => {
    if (ctx.orientation() !== "horizontal") return 1;
    return ctx.isRtl() ? -1 : 1;
  };

  const flush = () => {
    if (!drag) return;
    drag.frame = null;
    if (drag.pending !== null) ctx.setAdjacentSize(drag.handle, drag.pending);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (options.disabled() || event.button !== 0) return;

    const handle = event.currentTarget as HTMLElement;
    const adjacent = ctx.resolveAdjacent(handle);
    if (!adjacent) return;

    event.preventDefault();
    handle.setPointerCapture(event.pointerId);
    drag = {
      pointerId: event.pointerId,
      handle,
      startCoordinate: axisCoordinate(event),
      startPrevSize: adjacent.prevSize,
      frame: null,
      pending: null,
    };
    ctx.beginDrag();
    options.onDragging?.(true);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!drag || drag.pointerId !== event.pointerId) return;

    const handle = event.currentTarget as HTMLElement;
    if (!handle.hasPointerCapture(event.pointerId)) return;

    const sizePx = ctx.groupSizePx() || 1;
    const deltaPx = (axisCoordinate(event) - drag.startCoordinate) * dragSign();
    drag.pending = drag.startPrevSize + (deltaPx / sizePx) * 100;

    // 每帧最多写一次 store，避免高频 pointermove 造成布局抖动
    if (drag.frame === null) {
      drag.frame = requestAnimationFrame(flush);
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!drag || drag.pointerId !== event.pointerId) return;

    const handle = event.currentTarget as HTMLElement;
    if (drag.frame !== null) {
      cancelAnimationFrame(drag.frame);
      drag.frame = null;
      if (drag.pending !== null) ctx.setAdjacentSize(drag.handle, drag.pending);
    }
    if (handle.hasPointerCapture(event.pointerId)) {
      handle.releasePointerCapture(event.pointerId);
    }

    drag = undefined;
    ctx.endDrag();
    options.onDragging?.(false);
    ctx.commitLayout();
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    dispose() {
      if (drag?.frame != null) cancelAnimationFrame(drag.frame);
      drag = undefined;
    },
  };
}
