import type { Accessor, ParentProps } from "solid-js";

export interface PopoverProps extends ParentProps {
  /** 受控打开状态；不传则内部自管理（非受控模式） */
  open?: boolean;
  /** 非受控模式下的初始打开状态 */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  /** 是否启用 modal 模式（当前仅透传，不实现焦点陷阱） */
  modal?: boolean;
}

export interface PopoverContextValue {
  open: Accessor<boolean>;
  disabled: Accessor<boolean>;
  modal: Accessor<boolean>;
  contentId: string;
  reference: Accessor<Element | undefined>;
  setReference: (el: Element | undefined) => void;
  floating: Accessor<HTMLElement | undefined>;
  setFloating: (el: HTMLElement | undefined) => void;
  openPopover: () => void;
  closePopover: () => void;
  togglePopover: () => void;
}
