import { renderHook } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import {
  compareItemElements,
  createItemCollection,
} from "~/components/context-menu/ContextMenuContent/context-menu.popup-items";
import type { ContextMenuItemEntry } from "~/components/context-menu/context-menu.types";

function entry(
  id: string,
  element: HTMLElement,
  disabled = false,
): ContextMenuItemEntry {
  return {
    id,
    element,
    disabled: () => disabled,
    label: () => id,
    hasPopup: () => false,
    activate: vi.fn(),
  };
}

/** 把元素按给定顺序挂进容器，返回按 DOM 顺序排列的元素 */
function dom(elements: HTMLElement[]): HTMLElement[] {
  const container = document.createElement("div");
  document.body.appendChild(container);
  for (const element of elements) container.appendChild(element);
  return elements;
}

describe("compareItemElements", () => {
  it("同一元素返回 0", () => {
    const element = document.createElement("div");

    expect(compareItemElements(entry("a", element), entry("b", element))).toBe(
      0,
    );
  });

  it("前面的元素返回 -1，后面的返回 1", () => {
    const [first, second] = dom([
      document.createElement("div"),
      document.createElement("div"),
    ]);

    expect(compareItemElements(entry("a", first!), entry("b", second!))).toBe(
      -1,
    );
    expect(compareItemElements(entry("a", second!), entry("b", first!))).toBe(
      1,
    );
  });
});

describe("createItemCollection", () => {
  it("初始没有菜单项", () => {
    const { result } = renderHook(() => createItemCollection());

    expect(result.items()).toEqual([]);
    expect(result.orderedItems()).toEqual([]);
    expect(result.enabledItems()).toEqual([]);
  });

  it("注册后进入列表，注销后移出", () => {
    const { result } = renderHook(() => createItemCollection());
    const element = document.createElement("div");
    const item = entry("a", element);

    const unregister = result.registerItem(item);
    expect(result.items()).toEqual([item]);

    unregister();
    expect(result.items()).toEqual([]);
  });

  it("重复注销是安全的", () => {
    const { result } = renderHook(() => createItemCollection());
    const unregister = result.registerItem(
      entry("a", document.createElement("div")),
    );

    unregister();

    expect(() => unregister()).not.toThrow();
    expect(result.items()).toEqual([]);
  });

  it("按 DOM 顺序排序（与注册顺序无关）", () => {
    const [first, second, third] = dom([
      document.createElement("div"),
      document.createElement("div"),
      document.createElement("div"),
    ]);
    const { result } = renderHook(() => createItemCollection());

    result.registerItem(entry("third", third!));
    result.registerItem(entry("first", first!));
    result.registerItem(entry("second", second!));

    expect(result.orderedItems().map((item) => item.id)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("DOM 顺序变化后重新排序", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const first = document.createElement("div");
    const second = document.createElement("div");
    const third = document.createElement("div");
    container.append(first, second, third);
    const { result } = renderHook(() => createItemCollection());
    result.registerItem(entry("a", first));
    result.registerItem(entry("b", second));

    expect(result.orderedItems().map((item) => item.id)).toEqual(["a", "b"]);

    // 把第二个挪到前面（Solid 的 For 重排会做类似的事）
    container.insertBefore(second, first);
    // 排序 memo 只依赖注册列表，因此需要一次注册来触发重排
    // （真实场景里重排伴随 DOM 增删，注册表自然会变）
    result.registerItem(entry("c", third));

    expect(result.orderedItems().map((item) => item.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("enabledItems 过滤掉 disabled 项", () => {
    const [first, second, third] = dom([
      document.createElement("div"),
      document.createElement("div"),
      document.createElement("div"),
    ]);
    const { result } = renderHook(() => createItemCollection());

    result.registerItem(entry("a", first!));
    result.registerItem(entry("b", second!, true));
    result.registerItem(entry("c", third!));

    expect(result.enabledItems().map((item) => item.id)).toEqual(["a", "c"]);
    expect(result.orderedItems().map((item) => item.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});
