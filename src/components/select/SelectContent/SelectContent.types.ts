import type { ParentProps } from "solid-js";
import type { Alignment, Placement, Side } from "~/lib";

/**
 * 物理方向 + Base UI 的逻辑方向。
 * 当前与 PopoverContent 一致，按 LTR 映射（`inline-start` → `left`）。
 */
export type SelectSide = Side | "inline-start" | "inline-end";

/** 对齐方式；"center" 等价于不带 align 后缀的 placement */
export type SelectAlign = Alignment | "center";

export interface SelectContentProps extends ParentProps {
  /**
   * 贴 trigger 的哪一侧，默认 "bottom"。
   *
   * 当 `alignItemWithTrigger` 为 true 且已有选中值时，面板会切换成
   * “选中项对齐”，此时 `side` 不生效；它只在没有选中值、或
   * `alignItemWithTrigger={false}` 时决定贴边方向。
   */
  side?: SelectSide;
  /**
   * 沿边对齐方式，默认 "start"。
   *
   * 与 `side` 一样，在“选中项对齐”模式下不生效。
   */
  align?: SelectAlign;
  /** 沿 `side` 方向与 trigger 的间距（像素），默认 4；“选中项对齐”模式下忽略 */
  sideOffset?: number;
  /** 沿 `align` 方向的偏移（像素），默认 0；“选中项对齐”模式下忽略 */
  alignOffset?: number;
  /**
   * 是否让选中项文本与 trigger 的 value 文本对齐，默认 true。
   *
   * - true：有选中值时面板覆盖 trigger，让选中项本身对齐 trigger；
   *   没有选中值时按 `side`/`align` 贴边摆放。
   * - false：始终按 `side`/`align` 贴边摆放，和 Popover/Dropdown 一致。
   *
   * 命名与 Base UI 的 `Select.Positioner` 对齐。
   */
  alignItemWithTrigger?: boolean;
  /** 距视口边缘的最小间距（像素），用于 flip/shift 的边界检测，默认 8 */
  collisionPadding?: number;
  /**
   * @deprecated 使用 `side` + `align` 组合。保留为兼容别名，1.0 移除。
   * 传入时优先于 side/align。
   */
  placement?: Placement;
  class?: string;
  /**
   * 其余任意原生 div 属性都会原样透传到最终渲染的元素上——和 SelectTrigger
   * 是同一套约定。
   */
  [key: string]: any;
}
