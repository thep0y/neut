import { createEffect, mergeProps, onCleanup, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { ResizablePanelGroupContext } from "../resizable.context";
import { useResizablePanelGroup } from "../useResizablePanelGroup";
import type { ResizablePanelGroupProps } from "../resizable.types";

/**
 * 可调整布局的根:声明排列方向与初始/持久化布局,向下提供 context。
 * 子节点按 `Panel / Handle / Panel ...` 交替组合。
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

  // 拖拽期间强制全局双箭头光标:与 react-resizable-panels 一样注入一条
  // `*, *:hover { cursor: … !important }`,这样指针经过面板/文字/链接时也不会变回默认光标;
  // 顺带禁用文本选择,避免拖拽中选中内容。
  createEffect(() => {
    if (!ctx.dragging()) return;
    const cursor =
      local.orientation === "horizontal" ? "ew-resize" : "ns-resize";
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
