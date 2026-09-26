import type { Accessor, ParentProps } from "solid-js";
import type {
  ContextMenuChangeEventDetails,
  ContextMenuOrientation,
} from "~/components/context-menu/context-menu.types";

export interface DropdownMenuProps extends ParentProps {
  /** 受控打开状态；不传则内部自管理 */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (
    open: boolean,
    eventDetails: ContextMenuChangeEventDetails,
  ) => void;
  disabled?: boolean;
  /** 方向键到达两端时是否回到另一端，默认 true */
  loopFocus?: boolean;
  highlightItemOnHover?: boolean;
  orientation?: ContextMenuOrientation;
  /** 打开时是否锁定页面滚动，默认 true */
  modal?: boolean;
}

export interface DropdownMenuContextValue {
  open: Accessor<boolean>;
  disabled: Accessor<boolean>;
  /** 设置打开状态（受控模式下只回调） */
  setOpen: (open: boolean, event?: Event) => void;
  /** 触发器用：打开/关闭切换 */
  toggle: (event?: Event) => void;
  trigger: Accessor<HTMLElement | undefined>;
  setTrigger: (el: HTMLElement | undefined) => void;
  contentId: string;
}
