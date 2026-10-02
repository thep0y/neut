import { onCleanup } from "solid-js";
import { useResizablePanelGroupContext } from "../resizable.context";
import { handleResizableHandleKeyDown } from "./resizable.handle-keys";

interface DragState {
  pointerId: number;
  handle: HTMLElement;
  startCoordinate: number;
  startPrevSize: number;
  frame: number | null;
  pending: number | null;
}

interface Options {
  disabled: () => boolean;
  onDragging?: (dragging: boolean) => void;
}

/**
 * Handle 的拖拽与键盘交互:
 * - pointer capture 保证指针移出元素后仍能继续拖拽;
 * - pointermove 用 rAF 合并,避免每个事件都写一次 store(布局抖动);
 * - px -> % 用 group 主轴尺寸换算,横向在 RTL 下取反。
 */
export function useResizableHandle(options: Options) {
  const ctx = useResizablePanelGroupContext("ResizableHandle");
  let drag: DragState | undefined;

  onCleanup(() => {
    if (drag?.frame != null) cancelAnimationFrame(drag.frame);
    drag = undefined;
  });

  const axisCoordinate = (event: PointerEvent) =>
    ctx.orientation() === "horizontal" ? event.clientX : event.clientY;

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
    if (drag.frame === null) {
      drag.frame = requestAnimationFrame(flush);
    }
  };

  const endDrag = (event: PointerEvent) => {
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

  const onKeyDown = (event: KeyboardEvent) => {
    if (options.disabled()) return;

    const handle = event.currentTarget as HTMLElement;
    handleResizableHandleKeyDown(event, handle, {
      stepPercent: (ctx.keyboardResizeBy() / (ctx.groupSizePx() || 1)) * 100,
      rtl: ctx.orientation() === "horizontal" && ctx.isRtl(),
      resolveAdjacent: (target) => ctx.resolveAdjacent(target),
      nudgeAdjacent: (target, delta) => ctx.nudgeAdjacent(target, delta),
      setAdjacentSize: (target, size) => ctx.setAdjacentSize(target, size),
      commitLayout: () => ctx.commitLayout(),
      toggleHandleCollapse: (target) => ctx.toggleHandleCollapse(target),
    });
  };

  return { onPointerDown, onPointerMove, onPointerUp: endDrag, onKeyDown };
}
