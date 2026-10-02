import { onCleanup } from "solid-js";
import { useResizablePanelGroupContext } from "../resizable.context";
import { createHandleDrag } from "./resizable.handle-drag";
import { handleResizableHandleKeyDown } from "./resizable.handle-keys";

interface Options {
  disabled: () => boolean;
  onDragging?: (dragging: boolean) => void;
}

/**
 * Handle 的交互接线：指针拖拽交给 `createHandleDrag`（capture + rAF 合并），
 * 键盘调整交给 `handleResizableHandleKeyDown`；本 hook 只负责把
 * panel group 的 context 与自身 props 转接过去。
 */
export function useResizableHandle(options: Options) {
  const ctx = useResizablePanelGroupContext("ResizableHandle");

  const drag = createHandleDrag(
    {
      orientation: () => ctx.orientation(),
      isRtl: () => ctx.isRtl(),
      groupSizePx: () => ctx.groupSizePx(),
      resolveAdjacent: (handle) => ctx.resolveAdjacent(handle),
      setAdjacentSize: (handle, size) => ctx.setAdjacentSize(handle, size),
      beginDrag: () => ctx.beginDrag(),
      endDrag: () => ctx.endDrag(),
      commitLayout: () => ctx.commitLayout(),
    },
    options,
  );

  onCleanup(drag.dispose);

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

  return {
    onPointerDown: drag.onPointerDown,
    onPointerMove: drag.onPointerMove,
    onPointerUp: drag.onPointerUp,
    onKeyDown,
  };
}
