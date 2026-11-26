import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  type JSX,
} from "solid-js";
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
  // 选项 id 不能用 String(value) 派生：对象会变成 [object Object]，含空格的值
  // 会产生非法 id。用注册顺序生成唯一、无空白的 id。
  const optionIds = new Map<unknown, string>();
  let optionSeq = 0;
  const optionId = (value: unknown) => {
    const existing = optionIds.get(value);
    if (existing) return existing;
    const id = `${listId}-option-${optionSeq++}`;
    optionIds.set(value, id);
    return id;
  };

  const isGrouped = createMemo(() =>
    items().some(
      (item) =>
        item && typeof item === "object" && Array.isArray((item as any).items),
    ),
  );

  /**
   * 键盘/高亮/Enter 需要的是“可选中的叶子项”，不是分组对象。
   * 分组渲染仍由 ComboboxList + ComboboxCollection 负责，这里只做数据展开。
   */
  const flatItems = createMemo(() => {
    const all = items();
    if (!isGrouped()) return all;
    const flat: T[] = [];
    for (const group of all) {
      const groupItems = (group as any)?.items;
      if (Array.isArray(groupItems)) flat.push(...groupItems);
    }
    return flat;
  });

  const filteredItems = createMemo(() => {
    const query = filterValue().toLowerCase().trim();
    if (!query) return flatItems();
    return flatItems().filter((item) =>
      itemToStringValue()(item).toLowerCase().includes(query),
    );
  });

  const [disabledItems, setDisabledItems] = createSignal<Set<T>>(new Set());
  const isItemDisabled = (item: T) => disabledItems().has(item);
  const registerItemDisabled = (item: T) => {
    setDisabledItems((prev) => {
      const next = new Set(prev);
      next.add(item);
      return next;
    });
    return () => {
      setDisabledItems((prev) => {
        const next = new Set(prev);
        next.delete(item);
        return next;
      });
    };
  };

  // 关闭或过滤时不能继续保留上一次的高亮下标，否则 aria-activedescendant
  // 会指向已经不存在的项。
  createEffect(() => {
    if (!open()) setActiveIndex(-1);
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
    if (disabled() || isItemDisabled(item)) return;
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
    flatItems,
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
    isItemDisabled,
    registerItemDisabled,
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
