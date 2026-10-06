import { renderHook } from "@solidjs/testing-library";
import { createComponent, createSignal, type JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { ContextMenuPopupContext } from "~/components/context-menu/context-menu.context";
import { useContextMenuEntry } from "~/components/context-menu/context-menu.entry";
import type { ContextMenuPopupContextValue } from "~/components/context-menu/context-menu.types";

interface Harness {
  popup: ContextMenuPopupContextValue;
  registerItem: ReturnType<typeof vi.fn>;
  unregister: ReturnType<typeof vi.fn>;
  highlight: ReturnType<typeof vi.fn>;
  setActiveId: (id: string | undefined) => void;
  [key: string]: unknown;
}

function setup(options: { highlightItemOnHover?: boolean } = {}): Harness {
  const [activeId, setActiveId] = createSignal<string | undefined>();
  const highlight = vi.fn((id: string) => setActiveId(id));
  const unregister = vi.fn();
  const registerItem = vi.fn(() => unregister);
  const popup = {
    activeId,
    highlight,
    highlightItemOnHover: () => options.highlightItemOnHover ?? true,
    registerItem,
  } as unknown as ContextMenuPopupContextValue;

  return {
    popup,
    registerItem,
    unregister,
    highlight,
    setActiveId,
    activeId,
  } as Harness;
}

function wrapper(popup: ContextMenuPopupContextValue) {
  return (props: { children: JSX.Element }) =>
    createComponent(ContextMenuPopupContext.Provider, {
      value: popup,
      get children() {
        return props.children;
      },
    });
}

function makeElement(text: string | null = "复制"): HTMLElement {
  if (text === null) {
    // jsdom 里 HTMLElement.textContent 恒为字符串；用一个最小替身模拟"没有文本节点"
    return { textContent: null, click: vi.fn() } as unknown as HTMLElement;
  }
  const el = document.createElement("div");
  el.textContent = text;
  return el;
}

describe("useContextMenuEntry", () => {
  it("元素存在时挂载即登记到浮层，卸载时注销", () => {
    const harness = setup();
    const element = makeElement("复制");
    const { cleanup } = renderHook(
      () =>
        useContextMenuEntry({
          component: "ContextMenuItem",
          element: () => element,
          disabled: () => false,
          label: () => "复制",
        }),
      { wrapper: wrapper(harness.popup) },
    );

    expect(harness.registerItem).toHaveBeenCalledTimes(1);
    expect(harness.unregister).not.toHaveBeenCalled();

    cleanup();

    expect(harness.unregister).toHaveBeenCalledTimes(1);
  });

  it("元素缺失时不登记（ref 还没落到 DOM 上）", () => {
    const harness = setup();
    renderHook(
      () =>
        useContextMenuEntry({
          component: "ContextMenuItem",
          element: () => undefined,
          disabled: () => false,
          label: () => undefined,
        }),
      { wrapper: wrapper(harness.popup) },
    );

    expect(harness.registerItem).not.toHaveBeenCalled();
  });

  it("label 优先取显式 prop", () => {
    const harness = setup();
    const element = makeElement("DOM 文本");
    renderHook(
      () =>
        useContextMenuEntry({
          component: "ContextMenuItem",
          element: () => element,
          disabled: () => false,
          label: () => "显式标签",
        }),
      { wrapper: wrapper(harness.popup) },
    );

    const entry = harness.registerItem.mock.calls[0]![0] as {
      label: () => string;
    };
    expect(entry.label()).toBe("显式标签");
  });

  it("没有 label prop 时回退到元素文本并去掉首尾空白", () => {
    const harness = setup();
    const element = makeElement("  复制  ");
    renderHook(
      () =>
        useContextMenuEntry({
          component: "ContextMenuItem",
          element: () => element,
          disabled: () => false,
          label: () => undefined,
        }),
      { wrapper: wrapper(harness.popup) },
    );

    const entry = harness.registerItem.mock.calls[0]![0] as {
      label: () => string;
    };
    expect(entry.label()).toBe("复制");
  });

  it("元素没有文本节点时 label 回退为空串", () => {
    const harness = setup();
    const element = makeElement(null);
    renderHook(
      () =>
        useContextMenuEntry({
          component: "ContextMenuItem",
          element: () => element,
          disabled: () => false,
          label: () => undefined,
        }),
      { wrapper: wrapper(harness.popup) },
    );

    const entry = harness.registerItem.mock.calls[0]![0] as {
      label: () => string;
    };
    expect(entry.label()).toBe("");
  });

  it("未提供 hasPopup / activate / openPopup 时使用默认实现", () => {
    const harness = setup();
    const element = makeElement("复制");
    const click = vi.spyOn(element, "click");
    renderHook(
      () =>
        useContextMenuEntry({
          component: "ContextMenuItem",
          element: () => element,
          disabled: () => false,
          label: () => "复制",
        }),
      { wrapper: wrapper(harness.popup) },
    );

    const entry = harness.registerItem.mock.calls[0]![0] as {
      hasPopup: () => boolean;
      activate: () => void;
      openPopup?: unknown;
    };
    expect(entry.hasPopup()).toBe(false);
    expect(entry.openPopup).toBeUndefined();

    entry.activate();
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("提供 hasPopup / activate / openPopup 时按传入实现登记", () => {
    const harness = setup();
    const element = makeElement("更多");
    const activate = vi.fn();
    const openPopup = vi.fn();
    renderHook(
      () =>
        useContextMenuEntry({
          component: "ContextMenuSubTrigger",
          element: () => element,
          disabled: () => false,
          label: () => "更多",
          hasPopup: () => true,
          activate,
          openPopup,
        }),
      { wrapper: wrapper(harness.popup) },
    );

    const entry = harness.registerItem.mock.calls[0]![0] as {
      hasPopup: () => boolean;
      activate: () => void;
      openPopup: () => void;
    };
    expect(entry.hasPopup()).toBe(true);
    entry.activate();
    entry.openPopup();
    expect(activate).toHaveBeenCalledTimes(1);
    expect(openPopup).toHaveBeenCalledTimes(1);
  });

  it("返回稳定的 id 与所属浮层，isActive 跟随父级 activeId", () => {
    const harness = setup();
    const element = makeElement("复制");
    const { result } = renderHook(
      () =>
        useContextMenuEntry({
          component: "ContextMenuItem",
          element: () => element,
          disabled: () => false,
          label: () => "复制",
        }),
      { wrapper: wrapper(harness.popup) },
    );

    expect(result.id).toMatch(/^context-menu-item-/);
    expect(result.popup).toBe(harness.popup);
    expect(result.isActive()).toBe(false);

    harness.setActiveId(result.id);

    expect(result.isActive()).toBe(true);
  });

  it("悬停高亮受 highlightItemOnHover 控制", () => {
    const harness = setup({ highlightItemOnHover: true });
    const element = makeElement("复制");
    const { result } = renderHook(
      () =>
        useContextMenuEntry({
          component: "ContextMenuItem",
          element: () => element,
          disabled: () => false,
          label: () => "复制",
        }),
      { wrapper: wrapper(harness.popup) },
    );

    result.highlight();

    expect(harness.highlight).toHaveBeenCalledWith(result.id);
  });

  it("highlightItemOnHover=false 时悬停不高亮", () => {
    const harness = setup({ highlightItemOnHover: false });
    const element = makeElement("复制");
    const { result } = renderHook(
      () =>
        useContextMenuEntry({
          component: "ContextMenuItem",
          element: () => element,
          disabled: () => false,
          label: () => "复制",
        }),
      { wrapper: wrapper(harness.popup) },
    );

    result.highlight();

    expect(harness.highlight).not.toHaveBeenCalled();
  });

  it("禁用项的悬停不高亮", () => {
    const harness = setup({ highlightItemOnHover: true });
    const element = makeElement("复制");
    const { result } = renderHook(
      () =>
        useContextMenuEntry({
          component: "ContextMenuItem",
          element: () => element,
          disabled: () => true,
          label: () => "复制",
        }),
      { wrapper: wrapper(harness.popup) },
    );

    result.highlight();

    expect(harness.highlight).not.toHaveBeenCalled();
  });
});
