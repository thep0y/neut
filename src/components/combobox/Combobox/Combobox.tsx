import { createMemo, createSignal, createUniqueId, type JSX } from "solid-js";
import { ComboboxContext } from "./Combobox.context";
import type { ComboboxContextValue, ComboboxProps } from "./Combobox.types";

const DEFAULT_ITEM_TO_STRING = (item: any) => String(item);

export function Combobox<T = any>(props: ComboboxProps<T>): JSX.Element {
  const items = createMemo(() => props.items);
  const itemToStringValue = createMemo(
    () => props.itemToStringValue ?? DEFAULT_ITEM_TO_STRING,
  );

  const initialValue =
    props.value !== undefined ? props.value : props.defaultValue;
  const [inputValue, setInputValue] = createSignal(
    initialValue == null || Array.isArray(initialValue)
      ? ""
      : itemToStringValue()(initialValue as T),
  );
  const [filterValue, setFilterValue] = createSignal("");
  const [internalValue, setInternalValue] = createSignal<
    T | T[] | null | undefined
  >(props.defaultValue);
  const value = createMemo(() =>
    props.value !== undefined ? props.value : internalValue(),
  );

  const setValue = (next: T | T[] | null) => {
    if (props.value === undefined) setInternalValue(next as any);
    props.onValueChange?.(next);
  };

  const [internalOpen, setInternalOpen] = createSignal(
    props.defaultOpen ?? false,
  );
  const open = createMemo(() =>
    props.open !== undefined ? props.open : internalOpen(),
  );
  const disabled = createMemo(() => !!props.disabled);
  const multiple = createMemo(() => !!props.multiple);
  const setOpen = (next: boolean) => {
    if (props.open === undefined) setInternalOpen(next);
    props.onOpenChange?.(next);
  };

  const [activeIndex, setActiveIndex] = createSignal(-1);
  const [reference, setReference] = createSignal<HTMLElement>();
  const [floating, setFloating] = createSignal<HTMLElement>();
  const contentId = `combobox-content-${createUniqueId()}`;

  const isGrouped = createMemo(() =>
    items().some(
      (item) =>
        item && typeof item === "object" && Array.isArray((item as any).items),
    ),
  );

  const filteredItems = createMemo(() => {
    const query = filterValue().toLowerCase().trim();
    if (!query) return items();
    return items().filter((item) =>
      itemToStringValue()(item).toLowerCase().includes(query),
    );
  });

  const selectedItems = createMemo(() => {
    const current = value();
    if (current == null) return [] as T[];
    return Array.isArray(current) ? current : [current];
  });

  const isSelected = (item: T) =>
    selectedItems().some((selected) => selected === item);

  const close = () => setOpen(false);

  const selectItem = (item: T) => {
    if (disabled()) return;
    if (props.multiple) {
      const current = selectedItems();
      const next = isSelected(item)
        ? current.filter((selected) => selected !== item)
        : [...current, item];
      setValue(next);
      setInputValue("");
      setFilterValue("");
    } else {
      setValue(item);
      setInputValue(itemToStringValue()(item));
      setFilterValue("");
      close();
    }
  };

  const ctx: ComboboxContextValue<T> = {
    items,
    filteredItems,
    isGrouped,
    inputValue,
    setInputValue,
    filterValue,
    setFilterValue,
    open,
    setOpen,
    disabled,
    multiple,
    value,
    setValue,
    selectItem,
    isSelected,
    itemToStringValue: (item) => itemToStringValue()(item),
    activeIndex,
    setActiveIndex,
    reference,
    setReference,
    floating,
    setFloating,
    contentId,
    close,
  };

  return (
    <ComboboxContext.Provider value={ctx}>
      {props.children}
    </ComboboxContext.Provider>
  );
}
