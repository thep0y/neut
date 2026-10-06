import { mergeProps, onCleanup, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { ResizablePanelGroupContext } from "../resizable.context";
import type { ResizablePanelGroupProps } from "../resizable.types";
import { useResizablePanelGroup } from "../useResizablePanelGroup";
import { useDragCursor } from "./useDragCursor";

/**
 * 可调整布局的根：声明排列方向与初始/持久化布局，向下提供 context。
 * 子节点按 `Panel / Handle / Panel ...` 交替组合。
 *
 * 布局引擎在 `useResizablePanelGroup`，拖拽光标在 `useDragCursor`，
 * 本文件只负责默认值合并与框架渲染。
 */
export function ResizablePanelGroup(props: ResizablePanelGroupProps) {
  const merged = mergeProps(
    { orientation: "horizontal" as const, keyboardResizeBy: 10 },
    props,
  );
  const [local, rest] = splitProps(merged, [
    "class",
    "classList",
    "orientation",
    "defaultLayout",
    "onLayoutChange",
    "autoSaveId",
    "storage",
    "keyboardResizeBy",
    "children",
  ]);

  const ctx = useResizablePanelGroup({
    orientation: () => local.orientation,
    defaultLayout: () => local.defaultLayout,
    onLayoutChange: (next) => local.onLayoutChange?.(next),
    autoSaveId: () => local.autoSaveId,
    storage: () => local.storage,
    keyboardResizeBy: () => local.keyboardResizeBy,
  });

  useDragCursor(ctx.dragging, () => local.orientation);

  return (
    <ResizablePanelGroupContext.Provider value={ctx}>
      <div
        {...rest}
        ref={(el) => {
          ctx.setGroupElement(el);
          onCleanup(() => ctx.setGroupElement(undefined));
        }}
        data-slot="resizable-panel-group"
        role="group"
        data-orientation={local.orientation}
        data-dragging={ctx.dragging() ? "" : undefined}
        class={clsx(
          "flex h-full w-full data-[orientation=vertical]:flex-col",
          local.class,
        )}
        classList={local.classList}
      >
        {local.children}
      </div>
    </ResizablePanelGroupContext.Provider>
  );
}
