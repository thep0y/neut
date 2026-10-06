import { createRovingNavigation } from "~/utils";
import type {
  ToggleGroupContextValue,
  ToggleGroupValue,
} from "./ToggleGroup.types";

/**
 * ToggleGroup 的 roving focus 键盘导航。
 *
 * 通用算法已抽到 `~/utils/roving-navigation`(与 Tabs 共用同一份),
 * 这里只接上 context,并补两处 ToggleGroup 特有语义:
 *
 * - 整组 `disabled` 时不接管任何按键;
 * - 判断书写方向时用 `event.currentTarget` 的实际 computed direction,
 *   这样祖先节点上的 `dir="rtl"` 也能被正确识别(对齐 base-ui)。
 */
export function useToggleGroupKeyboard<
  TValue extends ToggleGroupValue = ToggleGroupValue,
>(ctx: ToggleGroupContextValue<TValue>) {
  return createRovingNavigation<TValue>({
    getItems: () => ctx.getItems(),
    orientation: ctx.orientation,
    dir: ctx.dir,
    loop: ctx.loopFocus,
    disabled: ctx.disabled,
    getDirectionElement: (event) => event.currentTarget as Element | null,
    onHighlight: ctx.setHighlightedValue,
  });
}
