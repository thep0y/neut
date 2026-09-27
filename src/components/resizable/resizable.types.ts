import type { Accessor } from "solid-js";
import type { BaseProps, PolymorphicProps } from "~/types";

export type ResizableOrientation = "horizontal" | "vertical";

/** 尺寸:number 视为百分比;字符串支持 "25%" 或 "25"(仅百分比,不支持 px) */
export type ResizableSize = number | `${number}%` | `${number}`;

/** 布局:id -> 百分比(0-100),对齐 react-resizable-panels 的 Layout */
export type ResizableLayout = Record<string, number>;

export interface ResizablePanelGroupProps
  extends PolymorphicProps<
    "div",
    BaseProps & {
      /** 排列方向,默认 "horizontal" */
      orientation?: ResizableOrientation;
      /** 初始布局(按 panel id),仅在首次挂载时使用 */
      defaultLayout?: ResizableLayout;
      /** 布局变化回调(拖拽、键盘、命令都会触发) */
      onLayoutChange?: (layout: ResizableLayout) => void;
      /** 自动持久化到 storage 的 key */
      autoSaveId?: string;
      /** 持久化介质,默认 localStorage(不可用时关闭持久化) */
      storage?: Storage;
      /** 键盘方向键一次移动的像素,默认 10 */
      keyboardResizeBy?: number;
    },
    false
  > {}

export interface ResizablePanelHandle {
  /** 折叠;不可折叠或已折叠时返回 false */
  collapse: () => boolean;
  /** 展开;不可折叠或未折叠时返回 false */
  expand: () => boolean;
  /** 直接设置该 panel 的百分比尺寸 */
  resize: (size: number) => void;
  getSize: () => number;
  isCollapsed: () => boolean;
  isExpanded: () => boolean;
}

export interface ResizablePanelProps
  extends PolymorphicProps<
    "div",
    BaseProps & {
      /** 布局持久化/onLayoutChange 里的键;缺省用自动 id */
      id?: string;
      /** 初始尺寸,默认均分剩余空间 */
      defaultSize?: ResizableSize;
      /** 最小尺寸,默认 0 */
      minSize?: ResizableSize;
      /** 最大尺寸,默认 100 */
      maxSize?: ResizableSize;
      /** 是否可在拖拽到 minSize 以下时折叠 */
      collapsible?: boolean;
      /** 折叠后的尺寸,默认 0 */
      collapsedSize?: ResizableSize;
      onResize?: (size: number) => void;
      onCollapse?: () => void;
      onExpand?: () => void;
      /** 暴露命令式句柄 */
      panelRef?: (handle: ResizablePanelHandle | undefined) => void;
    },
    false
  > {}

export interface ResizableHandleProps
  extends PolymorphicProps<
    "div",
    BaseProps & {
      id?: string;
      /** 禁用拖拽与键盘调整 */
      disabled?: boolean;
      /** 显示可见的抓手 */
      withHandle?: boolean;
      /** 拖拽开始/结束 */
      onDragging?: (dragging: boolean) => void;
    },
    false
  > {}

/** 引擎内部使用的 panel 元数据(constraints 用 accessor 保持响应式) */
export interface ResizablePanelMeta {
  id: string;
  element: HTMLElement;
  minSize: Accessor<number>;
  maxSize: Accessor<number>;
  collapsible: Accessor<boolean>;
  collapsedSize: Accessor<number>;
  defaultSize: number | undefined;
  onResize?: (size: number) => void;
  onCollapse?: () => void;
  onExpand?: () => void;
}
