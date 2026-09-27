import type { Accessor, ParentProps, ValidComponent } from "solid-js";
import type { Alignment, Side } from "~/lib";
import type { BaseProps, PolymorphicProps } from "~/types";

export type HoverCardSide = Side | "inline-start" | "inline-end";

export interface HoverCardProps extends ParentProps {
  /** 受控 open;不传则内部自管理 */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** 悬停多久后打开(ms),默认 700;trigger 上的 delay 优先 */
  delay?: number;
  /** 移出后多久关闭(ms),默认 300;trigger 上的 closeDelay 优先 */
  closeDelay?: number;
  disabled?: boolean;
}

export interface HoverCardContextValue {
  open: Accessor<boolean>;
  disabled: Accessor<boolean>;
  contentId: string;
  reference: Accessor<Element | undefined>;
  setReference: (el: Element) => void;
  floating: Accessor<HTMLElement | undefined>;
  setFloating: (el: HTMLElement | undefined) => void;
  requestOpen: (delayOverride?: number) => void;
  requestClose: (closeDelayOverride?: number) => void;
  openImmediate: () => void;
  closeImmediate: () => void;
  keepOpen: () => void;
}

interface BaseHoverCardContentProps extends BaseProps {
  /** 贴 trigger 的哪一侧,默认 "bottom" */
  side?: HoverCardSide;
  /** 沿边对齐方式,默认 "center" */
  align?: Alignment | "center";
  /** 与 trigger 的间距(px),默认 4 */
  sideOffset?: number;
  /** 交叉轴偏移(px),默认 4 */
  alignOffset?: number;
  /** 距视口边缘最小间距(px),默认 8 */
  collisionPadding?: number;
}

export type HoverCardContentProps = PolymorphicProps<
  "div",
  BaseHoverCardContentProps,
  false
>;

export type HoverCardTriggerProps<T extends ValidComponent> = PolymorphicProps<
  T,
  {
    /** 覆盖根的打开延迟(ms) */
    delay?: number;
    /** 覆盖根的关闭延迟(ms) */
    closeDelay?: number;
    disabled?: boolean;
  }
>;
