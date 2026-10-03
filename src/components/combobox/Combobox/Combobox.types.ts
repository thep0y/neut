import type { Accessor, ParentProps } from "solid-js";
import type { ChangeEventDetails } from "~/utils";

/** 值变更的触发来源（对齐 Base UI 的 reason 取值风格） */
export type ComboboxValueChangeReason =
  | "item-press"
  | "trigger-press"
  | "clear-press"
  | "input-change"
  | "chip-remove"
  | "none";

/** 开合变更的触发来源 */
export type ComboboxOpenChangeReason =
  | "trigger-press"
  | "input-focus"
  | "input-change"
  | "item-press"
  | "clear-press"
  | "escape-key"
  | "outside-press"
  | "none";

export interface ComboboxProps<T = any> extends ParentProps {
  items: T[];
  value?: T | T[] | null;
  defaultValue?: T | T[];
  onValueChange?: (
    value: T | T[] | null,
    details: ChangeEventDetails<ComboboxValueChangeReason>,
  ) => void;
  multiple?: boolean;
  disabled?: boolean;
  /**
   * 打开时是否锁定页面滚动，默认 true：锁住文档滚动并拦截浮层之外的
   * 滚轮/触摸滚动，面板自身仍可滚动。
   */
  lockScroll?: boolean;
  autoHighlight?: boolean;
  itemToStringValue?: (item: T) => string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (
    open: boolean,
    details: ChangeEventDetails<ComboboxOpenChangeReason>,
  ) => void;
}

export interface ComboboxContextValue<T = any> {
  items: Accessor<T[]>;
  filteredItems: Accessor<T[]>;
  isGrouped: Accessor<boolean>;
  inputValue: Accessor<string>;
  setInputValue: (value: string) => void;
  filterValue: Accessor<string>;
  setFilterValue: (value: string) => void;
  open: Accessor<boolean>;
  setOpen: (
    open: boolean,
    reason?: ComboboxOpenChangeReason,
    event?: Event,
  ) => void;
  disabled: Accessor<boolean>;
  multiple: Accessor<boolean>;
  value: Accessor<T | T[] | null | undefined>;
  setValue: (
    value: T | T[] | null,
    reason?: ComboboxValueChangeReason,
    event?: Event,
  ) => void;
  selectItem: (item: T, event?: Event) => void;
  isSelected: (item: T) => boolean;
  itemToStringValue: (item: T) => string;
  activeIndex: Accessor<number>;
  setActiveIndex: (index: number) => void;
  reference: Accessor<HTMLElement | undefined>;
  setReference: (el: HTMLElement | undefined) => void;
  floating: Accessor<HTMLElement | undefined>;
  setFloating: (el: HTMLElement | undefined) => void;
  contentId: string;
  /** listbox 元素的 id，供输入框的 aria-controls 指向 */
  listId: string;
  /** 某一项对应的 option 元素 id，供 aria-activedescendant 指向 */
  optionId: (value: unknown) => string;
  close: (reason?: ComboboxOpenChangeReason, event?: Event) => void;
}
