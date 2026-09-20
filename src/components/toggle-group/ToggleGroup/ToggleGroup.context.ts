import { createContext, createSignal, useContext } from "solid-js";
import { createChangeEventDetails } from "./create-change-event-details";
import type {
  ToggleGroupChangeEventDetails,
  ToggleGroupContextValue,
  ToggleGroupItemEntry,
  ToggleGroupOrientation,
  ToggleGroupSize,
  ToggleGroupVariant,
} from "./ToggleGroup.types";

const ToggleGroupContext = createContext<ToggleGroupContextValue>();

/** createToggleGroupState 的输入:与 ToggleGroupProps 的运行时字段一致 */
export interface ToggleGroupStateProps {
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (
    value: string[],
    eventDetails: ToggleGroupChangeEventDetails,
  ) => void;
  multiple: boolean;
  disabled: boolean;
  orientation: ToggleGroupOrientation;
  loopFocus: boolean;
  dir?: "ltr" | "rtl" | "auto";
  spacing: number;
  variant?: ToggleGroupVariant;
  size?: ToggleGroupSize;
}

/**
 * ToggleGroup 的唯一状态源:选中值(受控/非受控)、焦点高亮、item 注册表。
 *
 * 返回的 context 值里所有字段都是 accessor,因此传入的 `props` 可以是
 * splitProps/mergeProps 得到的响应式代理,读取始终是最新值。
 * 组件根只负责输出 DOM 与 data-* 样式钩子,状态与交互算法收敛在这里。
 */
export function createToggleGroupState(
  props: ToggleGroupStateProps,
): ToggleGroupContextValue {
  const [internalValue, setInternalValue] = createSignal<string[]>([
    ...(props.defaultValue ?? []),
  ]);
  const [highlightedValue, setHighlightedValue] = createSignal<
    string | undefined
  >();
  const [itemOrder, setItemOrder] = createSignal<ToggleGroupItemEntry[]>([]);

  const isControlled = () => props.value !== undefined;
  // 受控优先:props.value 存在时读外部值,否则读内部状态
  const value = (): readonly string[] =>
    isControlled() ? (props.value as readonly string[]) : internalValue();

  const isPressed = (v: string) => value().includes(v);

  const toggleItem = (
    itemValue: string,
    event: Event,
    trigger?: Element,
  ): void => {
    const current = value();
    const pressed = current.includes(itemValue);

    // 对齐 base-ui:单选时再次点击已按下项会取消选中(next = [])
    let next: string[];
    if (props.multiple) {
      next = pressed
        ? current.filter((v) => v !== itemValue)
        : [...current, itemValue];
    } else {
      next = pressed ? [] : [itemValue];
    }

    // 先通知外部:onValueChange 中 cancel() 可阻止组件提交本次变更
    const details = createChangeEventDetails(event, trigger);
    props.onValueChange?.(next, details);
    if (details.isCanceled) return;

    // 受控模式只通知外部,不改内部状态
    if (!isControlled()) setInternalValue(next);
  };

  const registerItem = (entry: ToggleGroupItemEntry) => {
    setItemOrder((prev) => [...prev, entry]);
    return () => setItemOrder((prev) => prev.filter((item) => item !== entry));
  };

  const isFirstEnabled = (v: string) =>
    itemOrder().find((item) => !item.disabled())?.value === v;

  const isUsable = (v: string) =>
    itemOrder().some((item) => item.value === v && !item.disabled());

  return {
    value,
    multiple: () => props.multiple,
    disabled: () => props.disabled,
    orientation: () => props.orientation,
    loopFocus: () => props.loopFocus,
    dir: () => props.dir,
    spacing: () => props.spacing,
    variant: () => props.variant,
    size: () => props.size,
    highlightedValue,
    isPressed,
    toggleItem,
    setHighlightedValue,
    registerItem,
    getItems: () => itemOrder(),
    isFirstEnabled,
    isUsable,
  };
}

export function useToggleGroupContext(
  component: string,
): ToggleGroupContextValue {
  const ctx = useContext(ToggleGroupContext);
  if (!ctx) {
    throw new Error(`<${component}> 必须渲染在 <ToggleGroup> 内部`);
  }
  return ctx;
}

export { ToggleGroupContext };
