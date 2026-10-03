import { renderHook } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import type { QuestionnaireItemHandle } from "~/components/questionnaire/questionnaire.context";
import { createItemRegistry } from "~/components/questionnaire/questionnaire.registry";

function handle(name: string, element = document.createElement("fieldset")) {
  return {
    name,
    element,
    disabled: () => false,
    required: () => false,
    status: () => "answered",
    validate: () => true,
    focus: vi.fn(),
    focusInvalid: vi.fn(),
    skip: vi.fn(),
    reset: vi.fn(),
    getAnswerByElement: () => null,
    getAnswerByShortcut: () => null,
    moveAnswerFocus: () => false,
  } as unknown as QuestionnaireItemHandle;
}

describe("createItemRegistry", () => {
  it("初始没有任何题目", () => {
    const { result } = renderHook(() => createItemRegistry());

    expect(result.items()).toEqual([]);
  });

  it("注册后按注册顺序保留", () => {
    const { result } = renderHook(() => createItemRegistry());
    const a = handle("a");
    const b = handle("b");

    result.register(a);
    result.register(b);

    expect(result.items()).toEqual([a, b]);
  });

  it("注销后移出列表", () => {
    const { result } = renderHook(() => createItemRegistry());
    const a = handle("a");
    const b = handle("b");
    const unregisterA = result.register(a);
    result.register(b);

    unregisterA();

    expect(result.items()).toEqual([b]);
  });

  it("同一个元素再次注册时替换而不是追加（保持原位置）", () => {
    const { result } = renderHook(() => createItemRegistry());
    const element = document.createElement("fieldset");
    const first = handle("a", element);
    const other = handle("b");
    const second = handle("a", element);
    result.register(first);
    result.register(other);

    result.register(second);

    expect(result.items()).toEqual([second, other]);
  });

  it("替换后旧句柄的注销函数不会误删新句柄", () => {
    const { result } = renderHook(() => createItemRegistry());
    const element = document.createElement("fieldset");
    const first = handle("a", element);
    const second = handle("a", element);
    const unregisterFirst = result.register(first);
    result.register(second);

    unregisterFirst();

    expect(result.items()).toEqual([second]);
  });

  it("重复注销同一个句柄是安全的", () => {
    const { result } = renderHook(() => createItemRegistry());
    const unregister = result.register(handle("a"));

    unregister();
    expect(() => unregister()).not.toThrow();
    expect(result.items()).toEqual([]);
  });
});
