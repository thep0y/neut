import type { Accessor, ParentProps } from "solid-js";
import type { BaseProps, PolymorphicProps } from "~/types";

export type DrawerSwipeDirection = "up" | "down" | "left" | "right";

export type DrawerChangeReason =
  | "trigger-press"
  | "close-press"
  | "outside-press"
  | "escape-key"
  | "swipe"
  | "none";

export interface DrawerChangeEventDetails {
  reason: DrawerChangeReason;
  event?: Event;
  trigger?: Element;
  cancel: () => void;
  allowPropagation: () => void;
  readonly isCanceled: boolean;
  readonly isPropagationAllowed: boolean;
}

export interface DrawerProps extends ParentProps {
  /** 受控打开状态；不传则内部自管理 */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (
    open: boolean,
    eventDetails: DrawerChangeEventDetails,
  ) => void;
  /** 是否模态：显示遮罩、锁滚动、点击外部关闭，默认 true */
  modal?: boolean;
  /** 从哪一侧滑出，默认 down */
  swipeDirection?: DrawerSwipeDirection;
  /** 是否显示顶部的拖拽把手，默认 false */
  showSwipeHandle?: boolean;
  /** 是否禁止点击遮罩/外部关闭，默认 false */
  disablePointerDismissal?: boolean;
}

export interface DrawerContextValue {
  open: Accessor<boolean>;
  setOpen: (open: boolean, reason: DrawerChangeReason, event?: Event) => void;
  /** 关闭时保留挂载直到退场动画结束 */
  show: Accessor<boolean>;
  setShow: (show: boolean) => void;
  modal: Accessor<boolean>;
  swipeDirection: Accessor<DrawerSwipeDirection>;
  showSwipeHandle: Accessor<boolean>;
  disablePointerDismissal: Accessor<boolean>;
  trigger: Accessor<HTMLElement | undefined>;
  setTrigger: (el: HTMLElement | undefined) => void;
  popup: Accessor<HTMLElement | undefined>;
  setPopup: (el: HTMLElement | undefined) => void;
  contentId: string;
  titleId: Accessor<string | undefined>;
  setTitleId: (id: string | undefined) => void;
  descriptionId: Accessor<string | undefined>;
  setDescriptionId: (id: string | undefined) => void;
  restoreFocus: () => void;
}

export type DrawerTriggerProps<
  T extends import("solid-js").ValidComponent = "button",
> = PolymorphicProps<T, BaseProps>;
export type DrawerCloseProps<
  T extends import("solid-js").ValidComponent = "button",
> = PolymorphicProps<T, BaseProps>;
