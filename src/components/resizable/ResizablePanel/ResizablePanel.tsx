import { createUniqueId, mergeProps, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { useResizablePanelGroupContext } from "../resizable.context";
import { buildPanelStyleText, roundPercent } from "../resizable.utils";
import type { ResizablePanelProps } from "../resizable.types";
import { useResizablePanel } from "./useResizablePanel";

/**
 * 一个可调整的面板。尺寸以百分比权重存在引擎里，这里只把它映射成 `flex-grow`，
 * 所以拖拽只会改两个面板的 style，内容不会重渲染。
 *
 * 注册与命令式句柄逻辑在 `useResizablePanel`，本文件只负责渲染与属性透传。
 */
export function ResizablePanel(props: ResizablePanelProps) {
  const ctx = useResizablePanelGroupContext("ResizablePanel");
  const merged = mergeProps(
    { minSize: 0, maxSize: 100, collapsible: false, collapsedSize: 0 } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "id",
    "defaultSize",
    "minSize",
    "maxSize",
    "collapsible",
    "collapsedSize",
    "onResize",
    "onCollapse",
    "onExpand",
    "panelRef",
    "class",
    "classList",
    "style",
    "children",
  ]);

  // 自动 id 只用于引擎/持久化，不回写到 DOM 的 id 属性（只有显式传入才透传）
  const id = local.id ?? createUniqueId();
  const { size, register } = useResizablePanel({ ctx, id, local });

  return (
    <div
      {...rest}
      id={local.id}
      ref={register}
      data-slot="resizable-panel"
      data-panel-id={id}
      data-panel-size={roundPercent(size())}
      data-panel-collapsed={ctx.isPanelCollapsed(id) ? "" : undefined}
      style={buildPanelStyleText(size(), local.style)}
      class={clsx("relative min-h-0 min-w-0 overflow-hidden", local.class)}
      classList={local.classList}
    >
      {local.children}
    </div>
  );
}
