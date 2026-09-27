import { createUniqueId, mergeProps, onCleanup, splitProps } from "solid-js";
import { clsx } from "~/utils";
import { useResizablePanelGroupContext } from "../resizable.context";
import { parseSize, roundPercent, toKebabCase } from "../resizable.utils";
import type {
  ResizablePanelMeta,
  ResizablePanelProps,
} from "../resizable.types";

/**
 * 一个可调整的面板。尺寸以百分比权重存在引擎里,这里只把它映射成 `flex-grow`,
 * 所以拖拽只会改两个面板的 style,内容不会重渲染。
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

  const id = local.id ?? createUniqueId();
  // 引擎初始化前的 fallback(例如 SSR 首屏):按 defaultSize 比例,未指定则等分。
  // 初始化后 store 里就是归一化到 100 的百分比。
  const fallbackSize =
    local.defaultSize === undefined ? 1 : parseSize(local.defaultSize, 1);
  const size = () => ctx.sizes()[id] ?? fallbackSize;

  // 用字符串形式声明 style:模板字面量会被 Solid 包进 effect,尺寸变化时能可靠更新;
  // 对象形式里的 getter 不保证被编译器识别为动态。
  const styleText = () => {
    const parts = [`flex-grow:${size()}`, "flex-shrink:1", "flex-basis:0%"];
    const extra = local.style;
    if (typeof extra === "string") parts.push(extra);
    else if (extra && typeof extra === "object") {
      for (const [key, value] of Object.entries(extra)) {
        if (value === null || value === undefined) continue;
        parts.push(`${toKebabCase(key)}:${value}`);
      }
    }
    return parts.join(";");
  };

  return (
    <div
      {...rest}
      id={local.id}
      ref={(el) => {
        const meta: ResizablePanelMeta = {
          id,
          element: el,
          minSize: () => parseSize(local.minSize, 0),
          maxSize: () => parseSize(local.maxSize, 100),
          collapsible: () => local.collapsible,
          collapsedSize: () => parseSize(local.collapsedSize, 0),
          defaultSize:
            local.defaultSize === undefined
              ? undefined
              : parseSize(local.defaultSize, 0),
          onResize: (value) => local.onResize?.(value),
          onCollapse: () => local.onCollapse?.(),
          onExpand: () => local.onExpand?.(),
        };
        const unregister = ctx.registerPanel(meta);
        local.panelRef?.({
          collapse: () => ctx.collapsePanel(id),
          expand: () => ctx.expandPanel(id),
          resize: (value) => ctx.setPanelSize(id, value),
          getSize: () => ctx.getPanelSize(id),
          isCollapsed: () => ctx.isPanelCollapsed(id),
          isExpanded: () => !ctx.isPanelCollapsed(id),
        });
        onCleanup(() => {
          unregister();
          local.panelRef?.(undefined);
        });
      }}
      data-slot="resizable-panel"
      data-panel-id={id}
      data-panel-size={roundPercent(size())}
      data-panel-collapsed={ctx.isPanelCollapsed(id) ? "" : undefined}
      style={styleText()}
      class={clsx("relative min-h-0 min-w-0 overflow-hidden", local.class)}
      classList={local.classList}
    >
      {local.children}
    </div>
  );
}
