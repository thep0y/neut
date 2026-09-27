import type { Accessor, ParentProps } from "solid-js";
import type { BaseProps, PolymorphicProps } from "~/types";

export type MessageScrollerDefaultPosition = "start" | "end" | "last-anchor";

export interface MessageScrollerProviderProps extends ParentProps {
  /** 读者位于实时边缘时，内容增长自动跟随（滚动离开后自动让位），默认 false */
  autoScroll?: boolean;
  /** 打开时停在何处，默认 "end"；"last-anchor" 无锚点或该回合放得下时回退到 "end" */
  defaultScrollPosition?: MessageScrollerDefaultPosition;
  /** 距任一边缘多少像素仍算「在起点/终点」，默认 8 */
  scrollEdgeThreshold?: number;
  /** scrollToMessage / 可见性 / 程序化目标的对齐边距（像素），默认 0 */
  scrollMargin?: number;
  /** 新回合锚定时，在 scrollMargin 之外额外保留的上一项高度（像素），默认 64 */
  scrollPreviousItemPeek?: number;
}

/** 命令选项：对齐方式、原生滚动行为、本次命令覆盖的 scrollMargin */
export interface MessageScrollerCommandOptions {
  align?: "start" | "center" | "end" | "nearest";
  behavior?: ScrollBehavior;
  scrollMargin?: number;
}

export interface MessageScrollerItemEntry {
  id?: string;
  element: HTMLElement;
  anchor: () => boolean;
}

export interface MessageScrollerContextValue {
  viewport: Accessor<HTMLElement | undefined>;
  setViewport: (el: HTMLElement | undefined) => void;
  content: Accessor<HTMLElement | undefined>;
  setContent: (el: HTMLElement | undefined) => void;
  registerItem: (entry: MessageScrollerItemEntry) => () => void;
  /** 上方插入历史时是否保持可见行（Viewport 的 prop） */
  preserveScrollOnPrepend: Accessor<boolean>;
  setPreserveScrollOnPrepend: (value: boolean) => void;
  /** 是否还能向上/向下滚动（供滚动控件与自定义 UI） */
  scrollableStart: Accessor<boolean>;
  scrollableEnd: Accessor<boolean>;
  /** 正在执行「滚动到最新消息」的程序化滚动（对应 data-autoscrolling） */
  autoscrolling: Accessor<boolean>;
  /** 初始定位尚未应用（对应 data-pending-scroll） */
  pendingScroll: Accessor<boolean>;
  scrollToStart: (options?: MessageScrollerCommandOptions) => boolean;
  scrollToEnd: (options?: MessageScrollerCommandOptions) => boolean;
  /** 目标未挂载且可排队（会话为空）时返回 true，其余失败返回 false */
  scrollToMessage: (
    messageId: string,
    options?: MessageScrollerCommandOptions,
  ) => boolean;
  /** 当前锚定的回合 id（阅读行之上最后一个 scrollAnchor），无则 null */
  currentAnchorId: Accessor<string | null>;
  /** 当前可见的消息 id（文档顺序） */
  visibleMessageIds: Accessor<string[]>;
  /** 订阅可见性；无订阅者时不计算（pay-for-what-you-use） */
  subscribeVisibility: () => () => void;
  options: Accessor<Required<Omit<MessageScrollerProviderProps, "children">>>;
}

export interface MessageScrollerVisibilityValue {
  currentAnchorId: Accessor<string | null>;
  visibleMessageIds: Accessor<string[]>;
}

export type MessageScrollerProps = PolymorphicProps<"div", BaseProps, false>;
export type MessageScrollerViewportProps = PolymorphicProps<
  "div",
  BaseProps & {
    "aria-label"?: string;
    /** 上方插入历史时保持可见行，默认 true */
    preserveScrollOnPrepend?: boolean;
  },
  false
>;
export type MessageScrollerContentProps = PolymorphicProps<
  "div",
  BaseProps & { "aria-busy"?: boolean },
  false
>;
export type MessageScrollerItemProps = PolymorphicProps<
  "div",
  BaseProps & { messageId?: string; scrollAnchor?: boolean },
  false
>;
export type MessageScrollerButtonProps = PolymorphicProps<
  "button",
  BaseProps & {
    direction?: "start" | "end";
    /** 原生滚动行为，默认 "smooth" */
    behavior?: ScrollBehavior;
    variant?: string;
    size?: string;
  }
>;
