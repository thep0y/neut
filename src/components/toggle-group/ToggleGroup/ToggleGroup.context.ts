import { createContext, createSignal, useContext } from "solid-js";
import { createChangeEventDetails } from "./create-change-event-details";
import type {
  ToggleGroupChangeEventDetails,
  ToggleGroupContextValue,
  ToggleGroupItemEntry,
  ToggleGroupOrientation,
  ToggleGroupSize,
  ToggleGroupValue,
  ToggleGroupVariant,
} from "./ToggleGroup.types";

const ToggleGroupContext = createContext<ToggleGroupContextValue>();

/** createToggleGroupState 的输入:与 ToggleGroupProps 的运行时字段一致 */
export interface ToggleGroupStateProps<
  TValue extends ToggleGroupValue = ToggleGroupValue,
> {
  value?: readonly TValue[];
  defaultValue?: readonly TValue[];
  onValueChange?: (
    value: TValue[],
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
 *
 * 值类型由泛型参数决定;内部只用 `===` / `includes` 做同一性比较,
 * 因此 string 与 number 都能正常工作。
 */
export function createToggleGroupState<
  TValue extends ToggleGroupValue = ToggleGroupValue,
>(props: ToggleGroupStateProps<TValue>): ToggleGroupContextValue<TValue> {
  const [internalValue, setInternalValue] = createSignal<TValue[]>([
    ...(props.defaultValue ?? []),
  ]);
  const [highlightedValue, setHighlightedValue] = createSignal<
    TValue | undefined
  >();
  const [itemOrder, setItemOrder] = createSignal<
    ToggleGroupItemEntry<TValue>[]
  >([]);

  const isControlled = () => props.value !== undefined;
  // 受控优先:props.value 存在时读外部值,否则读内部状态
  const value = (): readonly TValue[] =>
    isControlled() ? (props.value as readonly TValue[]) : internalValue();

  const isPressed = (v: TValue) => value().includes(v);

  const toggleItem = (
    itemValue: TValue,
    event: Event,
    trigger?: Element,
  ): void => {
    const current = value();
    const pressed = current.includes(itemValue);

    // 对齐 base-ui:单选时再次点击已按下项会取消选中(next = [])
    let next: TValue[];
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

  const registerItem = (entry: ToggleGroupItemEntry<TValue>) => {
    setItemOrder((prev) => [...prev, entry]);
    return () => setItemOrder((prev) => prev.filter((item) => item !== entry));
  };

  const isFirstEnabled = (v: TValue) =>
    itemOrder().find((item) => !item.disabled())?.value === v;

  const isUsable = (v: TValue) =>
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

/**
 * 读取 ToggleGroup 的 context。
 *
 * 泛型参数是**调用方标注**:组件本身无法从子节点推导所属 group 的值类型,
 * 自定义 item 时请显式传入与 ToggleGroup 一致的类型,例如
 * `useToggleGroupContext<"bold" | "italic">("MyToggle")`。
 */
export function useToggleGroupContext<
  TValue extends ToggleGroupValue = ToggleGroupValue,
>(component: string): ToggleGroupContextValue<TValue> {
  const ctx = useContext(ToggleGroupContext);
  if (!ctx) {
    throw new Error(`<${component}> 必须渲染在 <ToggleGroup> 内部`);
  }
  return ctx as ToggleGroupContextValue<TValue>;
}

export { ToggleGroupContext };
