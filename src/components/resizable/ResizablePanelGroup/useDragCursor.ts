import { type Accessor, createEffect, onCleanup } from "solid-js";
import type { ResizableOrientation } from "../resizable.types";

/**
 * 拖拽期间强制全局双箭头光标：注入一条 `*, *:hover { cursor: … !important }`，
 * 这样指针经过面板/文字/链接时也不会变回默认光标；顺带禁用文本选择，
 * 避免拖拽中选中内容。拖拽结束（或组件卸载）时还原。
 *
 * 与 react-resizable-panels 的行为一致，因此单独成 hook——
 * 它只依赖"是否拖拽中"与方向，跟布局引擎、渲染都无关。
 */
export function useDragCursor(
  dragging: Accessor<boolean>,
  orientation: Accessor<ResizableOrientation>,
) {
  createEffect(() => {
    if (!dragging()) return;

    const cursor = orientation() === "horizontal" ? "ew-resize" : "ns-resize";
    const sheet = document.createElement("style");
    sheet.setAttribute("data-resizable-drag", "");
    sheet.textContent = `*, *:hover { cursor: ${cursor} !important; }`;
    document.head.appendChild(sheet);

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    onCleanup(() => {
      sheet.remove();
      document.body.style.userSelect = previousUserSelect;
    });
  });
}
