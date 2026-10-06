import { onCleanup } from "solid-js";
import type { ResizablePanelGroupContextValue } from "../resizable.context";
import type {
  ResizablePanelHandle,
  ResizablePanelMeta,
  ResizableSize,
} from "../resizable.types";
import { parseSize } from "../resizable.utils";

/** 面板自己的配置（由 splitProps 得到，属性保持响应式读取） */
export interface ResizablePanelLocal {
  defaultSize?: ResizableSize;
  minSize: ResizableSize;
  maxSize: ResizableSize;
  collapsible: boolean;
  collapsedSize: ResizableSize;
  onResize?: (size: number) => void;
  onCollapse?: () => void;
  onExpand?: () => void;
  panelRef?: (handle: ResizablePanelHandle | undefined) => void;
}

export interface UseResizablePanelOptions {
  ctx: ResizablePanelGroupContextValue;
  id: string;
  local: ResizablePanelLocal;
}

/**
 * 面板的"注册与尺寸"逻辑：把 props 里的约束摊成引擎需要的 `ResizablePanelMeta`，
 * 在 ref 回调里注册/注销，并把命令式句柄交给 `panelRef`。
 *
 * 渲染层因此只需要消费 `size()` 与 `ref={register}`，
 * 不再关心 meta 的形状、注册时机与句柄方法。
 */
export function useResizablePanel(options: UseResizablePanelOptions) {
  const { ctx, id, local } = options;

  // 引擎初始化前的 fallback（例如 SSR 首屏）：按 defaultSize 比例，未指定则等分。
  // 初始化后 store 里就是归一化到 100 的百分比。
  const fallbackSize =
    local.defaultSize === undefined ? 1 : parseSize(local.defaultSize, 1);

  const size = () => ctx.sizes()[id] ?? fallbackSize;

  const buildMeta = (element: HTMLElement): ResizablePanelMeta => ({
    id,
    element,
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
  });

  const handle: ResizablePanelHandle = {
    collapse: () => ctx.collapsePanel(id),
    expand: () => ctx.expandPanel(id),
    resize: (value) => ctx.setPanelSize(id, value),
    getSize: () => ctx.getPanelSize(id),
    isCollapsed: () => ctx.isPanelCollapsed(id),
    isExpanded: () => !ctx.isPanelCollapsed(id),
  };

  /** 供 `ref` 使用：注册 meta、暴露句柄，卸载时按相反顺序回收 */
  const register = (element: HTMLElement) => {
    const unregister = ctx.registerPanel(buildMeta(element));
    local.panelRef?.(handle);
    onCleanup(() => {
      unregister();
      local.panelRef?.(undefined);
    });
  };

  return { size, register };
}
