import { createEffect, onCleanup, createMemo } from "solid-js";
import { useSelectContext } from "../Select/Select.context";
import type { SelectItemProps } from "./SelectItem.types";
import type { SelectOptionValue } from "../Select/Select.types";

export interface UseSelectItemResult {
  ctx: ReturnType<typeof useSelectContext>;
  label: () => string;
  isSelected: () => boolean;
  isActive: () => boolean;
  select: () => void;
  onMouseEnter: () => void;
}

export function useSelectItem<T extends SelectOptionValue = SelectOptionValue>(
  props: () => SelectItemProps<T>,
): UseSelectItemResult {
  const ctx = useSelectContext("SelectItem");

  const label = () => {
    const p = props();
    if (p.label) return p.label;
    return typeof p.children === "string" ? p.children : String(p.value);
  };

  // 注册项会进入 store；label/disabled 是响应式的，props 变化后必须
  // 重新登记，否则 SelectValue 与键盘导航会一直读旧快照。
  createEffect(() => {
    const p = props();
    const unregister = ctx.registerItem({
      value: p.value,
      label: label(),
      disabled: p.disabled,
    });
    onCleanup(unregister);
  });

  const isSelected = createMemo(() => ctx.value() === props().value);
  const isActive = createMemo(() => ctx.activeValue() === props().value);

  const select = () => {
    if (props().disabled) return;
    ctx.selectValue(props().value);
  };

  const onMouseEnter = () => {
    if (!props().disabled) ctx.setActiveValue(props().value);
  };

  return { ctx, label, isSelected, isActive, select, onMouseEnter };
}
