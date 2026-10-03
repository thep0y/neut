import { render } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { stubRect } from "~tests/components/message-scroller/test-utils";
import { Combobox } from "~/components/combobox/Combobox/Combobox";
import type { ComboboxProps } from "~/components/combobox/Combobox/Combobox.types";

/**
 * combobox 测试共用的渲染脚手架。
 *
 * `ComboboxContent` 走 `Portal`，节点挂在 `document.body` 上；因此查询一律直接
 * 扫 `document`，不要用 `render()` 返回的 `container`。
 */
export const DEFAULT_ITEMS = ["apple", "banana", "cherry"];

export type HarnessOptions = Partial<
  Omit<ComboboxProps<any>, "items" | "children">
> & { items?: any[] };

/**
 * 渲染一个 `Combobox` 并挂载被测子树。
 *
 * `children` 必须是**工厂函数**：Solid 的 `createComponent` 会立即执行组件函数，
 * 直接把 JSX 当参数传会让子组件在 Provider 建立之前求值，
 * `useComboboxContext` 必然抛"必须渲染在 <Combobox> 内部"。
 */
export function renderCombobox(
  options: HarnessOptions,
  children: () => JSX.Element,
) {
  return render(() => (
    <Combobox
      items={options.items ?? DEFAULT_ITEMS}
      value={options.value}
      defaultValue={options.defaultValue}
      multiple={options.multiple}
      disabled={options.disabled}
      open={options.open}
      defaultOpen={options.defaultOpen}
      onValueChange={options.onValueChange}
      onOpenChange={options.onOpenChange}
      itemToStringValue={options.itemToStringValue}
      lockScroll={options.lockScroll}
    >
      {children()}
    </Combobox>
  ));
}

/** 文档里按 `data-slot` 查一个元素（语义查询覆盖不到时的次选，见 TESTING.md §5.1）。 */
export function bySlot(slot: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-slot="${slot}"]`);
}

/** 文档里按 `data-slot` 查全部元素。 */
export function allBySlot(slot: string): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(`[data-slot="${slot}"]`),
  );
}

/** 当前文档里的输入框。 */
export function comboboxInput(): HTMLInputElement {
  return document.querySelector("input") as HTMLInputElement;
}

/** 当前文档里的所有 `role=option`。 */
export function comboboxOptions(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));
}

/**
 * 让元素报告指定宽度：jsdom 不做布局，`getBoundingClientRect()` 恒为 0，
 * 而"锚点宽度"分支需要非零值（TESTING.md §4.5：只 stub 系统边界）。
 */
export function stubWidth(el: HTMLElement, width: number): void {
  stubRect(el, { top: 0, bottom: 0 });
  const measured = el.getBoundingClientRect.bind(el);
  el.getBoundingClientRect = () =>
    ({ ...measured(), width, right: width }) as DOMRect;
}
