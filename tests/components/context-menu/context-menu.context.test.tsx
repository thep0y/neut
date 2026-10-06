import { renderHook } from "@solidjs/testing-library";
import { createComponent, createSignal, type JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import type {
  ContextMenuGroupContextValue,
  ContextMenuPopupContextValue,
  ContextMenuRadioGroupContextValue,
  ContextMenuSubmenuContextValue,
} from "~/components/context-menu/context-menu.types";
import {
  ContextMenuGroupContext,
  ContextMenuPopupContext,
  ContextMenuRadioGroupContext,
  ContextMenuSubmenuContext,
  useContextMenuGroup,
  useContextMenuPopup,
  useContextMenuRadioGroup,
  useContextMenuSubmenu,
} from "~/components/context-menu/context-menu.context";

/** 用 createComponent 包装 Provider，避免把 JSX 语法带进这个文件的辅助函数 */
function provider<T>(context: { Provider: unknown }, value: T) {
  return (props: { children: JSX.Element }) =>
    createComponent(context.Provider as never, {
      value,
      get children() {
        return props.children;
      },
    });
}

function fakePopup(): ContextMenuPopupContextValue {
  return {
    menuId: "menu-1",
    isSubmenu: false,
    highlightItemOnHover: () => true,
  } as unknown as ContextMenuPopupContextValue;
}

function fakeSubmenu(): ContextMenuSubmenuContextValue {
  return { disabled: () => false } as unknown as ContextMenuSubmenuContextValue;
}

function fakeRadioGroup(): ContextMenuRadioGroupContextValue {
  const [value] = createSignal("a");
  return {
    value,
    setValue: vi.fn(),
    disabled: () => false,
  };
}

function fakeGroup(): ContextMenuGroupContextValue {
  const [labelId] = createSignal<string>();
  return { labelId, setLabelId: vi.fn() };
}

describe("useContextMenuPopup", () => {
  it("脱离 Provider 使用时抛中文错误", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      renderHook(() => useContextMenuPopup("ContextMenuItem")),
    ).toThrow("<ContextMenuItem> 必须渲染在 <ContextMenuContent> 内部");

    spy.mockRestore();
  });

  it("存在 Provider 时原样返回上下文", () => {
    const value = fakePopup();
    const { result } = renderHook(
      () => useContextMenuPopup("ContextMenuItem"),
      {
        wrapper: provider(ContextMenuPopupContext, value),
      },
    );

    expect(result).toBe(value);
  });
});

describe("useContextMenuSubmenu", () => {
  it("脱离 Provider 使用时抛中文错误", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      renderHook(() => useContextMenuSubmenu("ContextMenuSubTrigger")),
    ).toThrow("<ContextMenuSubTrigger> 必须渲染在 <ContextMenuSub> 内部");

    spy.mockRestore();
  });

  it("存在 Provider 时原样返回上下文", () => {
    const value = fakeSubmenu();
    const { result } = renderHook(
      () => useContextMenuSubmenu("ContextMenuSubTrigger"),
      { wrapper: provider(ContextMenuSubmenuContext, value) },
    );

    expect(result).toBe(value);
  });
});

describe("useContextMenuRadioGroup", () => {
  it("脱离 Provider 使用时抛中文错误", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      renderHook(() => useContextMenuRadioGroup("ContextMenuRadioItem")),
    ).toThrow("<ContextMenuRadioItem> 必须渲染在 <ContextMenuRadioGroup> 内部");

    spy.mockRestore();
  });

  it("存在 Provider 时原样返回上下文", () => {
    const value = fakeRadioGroup();
    const { result } = renderHook(
      () => useContextMenuRadioGroup("ContextMenuRadioItem"),
      { wrapper: provider(ContextMenuRadioGroupContext, value) },
    );

    expect(result).toBe(value);
  });
});

describe("useContextMenuGroup", () => {
  it("脱离 Provider 使用时抛中文错误", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      renderHook(() => useContextMenuGroup("ContextMenuLabel")),
    ).toThrow("<ContextMenuLabel> 必须渲染在 <ContextMenuGroup> 内部");

    spy.mockRestore();
  });

  it("存在 Provider 时原样返回上下文", () => {
    const value = fakeGroup();
    const { result } = renderHook(
      () => useContextMenuGroup("ContextMenuLabel"),
      {
        wrapper: provider(ContextMenuGroupContext, value),
      },
    );

    expect(result).toBe(value);
  });
});
