import { createMemo, createSignal, createUniqueId, type JSX } from "solid-js";
import { useScrollLock } from "~/hooks";
import { createChangeEventDetails } from "~/utils";
import { ComboboxContext } from "./Combobox.context";
import type {
  ComboboxContextValue,
  ComboboxOpenChangeReason,
  ComboboxProps,
  ComboboxValueChangeReason,
} from "./Combobox.types";

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

  const setValue = (
    next: T | T[] | null,
    reason: ComboboxValueChangeReason = "none",
    event?: Event,
  ): boolean => {
    const details = createChangeEventDetails(reason, event, reference());
    // 先回调再落状态：调用方可以在 details.cancel() 里否决本次变更
    props.onValueChange?.(next, details);
    if (details.isCanceled) return false;
    if (props.value === undefined) setInternalValue(next as any);
    return true;
  };

  const [internalOpen, setInternalOpen] = createSignal(
    props.defaultOpen ?? false,
  );
  const open = createMemo(() =>
    props.open !== undefined ? props.open : internalOpen(),
  );
  const disabled = createMemo(() => !!props.disabled);
  const lockScroll = createMemo(() => props.lockScroll ?? true);

  // 打开期间默认锁定页面滚动：锁住文档滚动并拦截浮层之外的滚轮/触摸，
  // 面板自身仍可滚动。传 lockScroll={false} 可关闭该行为。
  useScrollLock(() => open() && lockScroll(), {
    allowedSelector: '[data-slot="combobox-content"]',
  });

  const multiple = createMemo(() => !!props.multiple);
  const setOpen = (
    next: boolean,
    reason: ComboboxOpenChangeReason = "none",
    event?: Event,
  ) => {
    const details = createChangeEventDetails(reason, event, reference());
    props.onOpenChange?.(next, details);
    if (details.isCanceled) return;
    if (props.open === undefined) setInternalOpen(next);
  };

  const [activeIndex, setActiveIndex] = createSignal(-1);
  const [reference, setReference] = createSignal<HTMLElement>();
  const [floating, setFloating] = createSignal<HTMLElement>();
  const contentId = `combobox-content-${createUniqueId()}`;
  const listId = `combobox-list-${createUniqueId()}`;
  // 选项 id 由 listId + 值派生：aria-activedescendant 需要能指向当前高亮项
  const optionId = (value: unknown) => `${listId}-option-${String(value)}`;

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

  const close = (reason: ComboboxOpenChangeReason = "none", event?: Event) =>
    setOpen(false, reason, event);

  const selectItem = (item: T, event?: Event) => {
    if (disabled()) return;
    const applied = setValue(
      props.multiple
        ? isSelected(item)
          ? selectedItems().filter((selected) => selected !== item)
          : [...selectedItems(), item]
        : item,
      "item-press",
      event,
    );
    // 值变更被 cancel() 时，输入框的展示与关闭也不该跟着变，
    // 否则会出现"值没改但输入框被回填/面板被关掉"的不一致状态
    if (!applied) return;
    if (props.multiple) {
      setInputValue("");
      setFilterValue("");
    } else {
      setInputValue(itemToStringValue()(item));
      setFilterValue("");
      close("item-press", event);
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
    listId,
    optionId,
    close,
  };

  return (
    <ComboboxContext.Provider value={ctx}>
      {props.children}
    </ComboboxContext.Provider>
  );
}
