import {
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  onCleanup,
} from "solid-js";
import { useTimePickerContext } from "../TimePicker/TimePicker.context";
import type {
  TimePickerOptionMeta,
  TimePickerUnitValue,
} from "../TimePicker/TimePicker.types";
import type { TimePickerColumnProps } from "./TimePickerColumn.types";
import {
  resolveColumnKeyAction,
  resolveNextOptionIndex,
  resolveNextUnit,
} from "./time-picker.column-utils";

/**
 * 单列 listbox 的交互算法:选项派生、选中值、跨列方向键、键盘提交、滚动入视。
 *
 * 焦点始终停留在列(listbox)自身,高亮/选中通过 `aria-activedescendant` 表达;
 * 由于选项与高亮合一(方向键移动即提交),selected 与 active 是同一个值。
 */
export function useTimePickerColumn(props: () => TimePickerColumnProps) {
  const ctx = useTimePickerContext("TimePickerColumn");
  const columnId = createUniqueId();
  const [listElement, setListElement] = createSignal<HTMLElement>();

  const options = createMemo<TimePickerOptionMeta[]>(() =>
    ctx.getOptions(props().unit),
  );
  const selected = createMemo<TimePickerUnitValue | undefined>(() =>
    ctx.getUnitValue(props().unit),
  );

  const optionId = (value: TimePickerUnitValue) =>
    `${columnId}-${String(value)}`;

  // 当前值可能不在步长上(如 minuteStep=15 而值的分钟是 7),
  // 此时找不到对应选项,不做 dangling 的 aria-activedescendant。
  const activeOptionId = createMemo(() => {
    const value = selected();
    if (value === undefined) return undefined;
    return options().some((option) => option.value === value)
      ? optionId(value)
      : undefined;
  });

  const commit = (value: TimePickerUnitValue, event: Event): void => {
    ctx.setUnitValue(props().unit, value, {
      reason: "keyboard",
      event,
      trigger: listElement(),
    });
  };

  /** 提交列表两端的选项（Home / End） */
  const commitBoundary = (boundary: "first" | "last", event: Event) => {
    const list = options();
    const option = boundary === "first" ? list[0] : list[list.length - 1];
    if (option) commit(option.value, event);
  };

  const move = (direction: 1 | -1, event: Event) => {
    const list = options();
    const index = list.findIndex((option) => option.value === selected());
    const nextIndex = resolveNextOptionIndex(index, direction, list.length);
    if (nextIndex === -1) return;
    commit(list[nextIndex]!.value, event);
  };

  const moveColumn = (direction: 1 | -1) => {
    const next = resolveNextUnit(
      ctx.units(),
      props().unit,
      direction,
      ctx.dir() === "rtl",
    );
    if (!next) return;
    ctx.setActiveUnit(next);
    ctx.getColumnElement(next)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (ctx.disabled() || ctx.readOnly()) return;

    const action = resolveColumnKeyAction(event.key);
    if (!action) return;
    event.preventDefault();

    if (action.type === "move") move(action.direction, event);
    else if (action.type === "moveColumn") moveColumn(action.direction);
    else if (action.type === "commitBoundary") {
      commitBoundary(action.boundary, event);
    }
  };

  const attachList = (element: HTMLElement) => {
    setListElement(element);
    const unregister = ctx.registerColumn(props().unit, element);
    const onFocus = () => ctx.setActiveUnit(props().unit);

    element.addEventListener("keydown", onKeyDown);
    element.addEventListener("focus", onFocus);
    onCleanup(() => {
      element.removeEventListener("keydown", onKeyDown);
      element.removeEventListener("focus", onFocus);
      unregister();
    });
  };

  // 选中值变化(含首次挂载)时把对应选项滚入视野
  createEffect(() => {
    const value = selected();
    const element = listElement();
    if (value === undefined || !element) return;
    element
      .querySelector<HTMLElement>(`[data-value="${CSS.escape(String(value))}"]`)
      ?.scrollIntoView({ block: "nearest" });
  });

  return {
    options,
    selected,
    activeOptionId,
    optionId,
    listElement,
    attachList,
  };
}
