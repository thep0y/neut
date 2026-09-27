import type { Accessor, ParentProps } from "solid-js";
import type { BaseProps, PolymorphicProps } from "~/types";

export type MessageScrollerDefaultPosition = "start" | "end" | "last-anchor";

export interface MessageScrollerProviderProps extends ParentProps {
  /** 读者位于实时边缘时，内容增长自动跟随（滚动离开后自动让位），默认 false */
  autoScroll?: boolean;
  /** 打开时停在何处，默认 "end" */
  defaultScrollPosition?: MessageScrollerDefaultPosition;
  /** 新回合锚定时，上方保留的上一项高度（像素），默认 0 */
  scrollPreviousItemPeek?: number;
  /** 上方插入历史时保持当前可见位置，默认 true */
  preserveScrollOnPrepend?: boolean;
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
  /** 是否还能向上/向下滚动（供滚动控件与自定义 UI） */
  scrollableStart: Accessor<boolean>;
  scrollableEnd: Accessor<boolean>;
  /** 正在执行程序化滚动（对应 data-autoscrolling） */
  autoscrolling: Accessor<boolean>;
  /** 初始定位尚未应用（对应 data-pending-scroll） */
  pendingScroll: Accessor<boolean>;
  scrollToStart: () => void;
  scrollToEnd: () => void;
  scrollToMessage: (id: string) => boolean;
  options: Accessor<Required<Omit<MessageScrollerProviderProps, "children">>>;
}

export type MessageScrollerProps = PolymorphicProps<"div", BaseProps, false>;
export type MessageScrollerViewportProps = PolymorphicProps<
  "div",
  BaseProps & { "aria-label"?: string },
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
    variant?: string;
    size?: string;
  }
>;
