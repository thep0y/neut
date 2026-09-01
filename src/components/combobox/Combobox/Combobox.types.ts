import type { Accessor, ParentProps } from "solid-js";

export interface ComboboxProps<T = any> extends ParentProps {
  items: T[];
  value?: T | T[] | null;
  defaultValue?: T | T[];
  onValueChange?: (value: T | T[] | null) => void;
  multiple?: boolean;
  disabled?: boolean;
  autoHighlight?: boolean;
  itemToStringValue?: (item: T) => string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
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
  setOpen: (open: boolean) => void;
  disabled: Accessor<boolean>;
  multiple: Accessor<boolean>;
  value: Accessor<T | T[] | null | undefined>;
  setValue: (value: T | T[] | null) => void;
  selectItem: (item: T) => void;
  isSelected: (item: T) => boolean;
  itemToStringValue: (item: T) => string;
  activeIndex: Accessor<number>;
  setActiveIndex: (index: number) => void;
  reference: Accessor<HTMLElement | undefined>;
  setReference: (el: HTMLElement | undefined) => void;
  floating: Accessor<HTMLElement | undefined>;
  setFloating: (el: HTMLElement | undefined) => void;
  contentId: string;
  close: () => void;
}
