import { createContext, useContext, type Accessor } from "solid-js";
import type {
  ResizableOrientation,
  ResizablePanelMeta,
} from "./resizable.types";

interface AdjacentPanels {
  prev: ResizablePanelMeta;
  next: ResizablePanelMeta;
  prevSize: number;
  total: number;
}

export interface ResizablePanelGroupContextValue {
  orientation: Accessor<ResizableOrientation>;
  /** id -> 百分比;store 代理,按 id 读取可精确追踪 */
  sizes: () => Record<string, number>;
  groupElement: Accessor<HTMLElement | undefined>;
  setGroupElement: (el: HTMLElement | undefined) => void;
  dragging: Accessor<boolean>;
  keyboardResizeBy: Accessor<number>;
  registerPanel: (meta: ResizablePanelMeta) => () => void;

  /** 拖拽/键盘:根据 handle 的相邻兄弟解析出前后两个 panel */
  resolveAdjacent: (handleEl: HTMLElement) => AdjacentPanels | undefined;
  setAdjacentSize: (handleEl: HTMLElement, targetPrevSize: number) => void;
  nudgeAdjacent: (handleEl: HTMLElement, deltaPercent: number) => void;
  toggleHandleCollapse: (handleEl: HTMLElement) => void;
  /** 沿主轴的可拖拽长度(px),用于 px -> % 换算 */
  groupSizePx: () => number;
  isRtl: () => boolean;
  beginDrag: () => void;
  endDrag: () => void;
  commitLayout: () => void;

  /** 命令式 panel 操作 */
  setPanelSize: (id: string, size: number) => void;
  collapsePanel: (id: string) => boolean;
  expandPanel: (id: string) => boolean;
  isPanelCollapsed: (id: string) => boolean;
  getPanelSize: (id: string) => number;
}

export const ResizablePanelGroupContext =
  createContext<ResizablePanelGroupContextValue>();

export function useResizablePanelGroupContext(
  component: string,
): ResizablePanelGroupContextValue {
  const ctx = useContext(ResizablePanelGroupContext);
  if (!ctx) {
    throw new Error(`<${component}> 必须渲染在 <ResizablePanelGroup> 内部`);
  }
  return ctx;
}
