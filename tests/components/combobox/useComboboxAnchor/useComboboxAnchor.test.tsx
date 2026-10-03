import { renderHook } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { useComboboxAnchor } from "~/components/combobox/useComboboxAnchor/useComboboxAnchor";

/**
 * `useComboboxAnchor`：给调用方一个"把任意元素登记为锚点"的信号对。
 * 组件本身不消费它，因此行为就是标准的 `createSignal` 契约。
 */
describe("useComboboxAnchor", () => {
  it("初始值为 undefined", () => {
    const { result } = renderHook(() => useComboboxAnchor());

    expect(result[0]()).toBeUndefined();
  });

  it("写入元素后可以读回同一个元素", () => {
    const { result } = renderHook(() => useComboboxAnchor());
    const anchor = document.createElement("div");

    result[1](anchor);

    expect(result[0]()).toBe(anchor);
  });

  it("可以重新写入为 undefined", () => {
    const { result } = renderHook(() => useComboboxAnchor());
    result[1](document.createElement("div"));

    result[1](undefined);

    expect(result[0]()).toBeUndefined();
  });
});
