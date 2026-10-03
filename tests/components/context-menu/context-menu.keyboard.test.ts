import { describe, expect, it, vi } from "vitest";
import { handleMenuKeyDown } from "~/components/context-menu/context-menu.keyboard";
import type {
  ContextMenuItemEntry,
  ContextMenuSubmenuContextValue,
} from "~/components/context-menu/context-menu.types";

function key(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  return new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
}

function entry(
  overrides: Partial<ContextMenuItemEntry> = {},
): ContextMenuItemEntry {
  return {
    id: "item-1",
    element: document.createElement("div"),
    disabled: () => false,
    label: () => "复制",
    hasPopup: () => false,
    activate: vi.fn(),
    ...overrides,
  };
}

function setup(
  overrides: {
    horizontal?: boolean;
    active?: ContextMenuItemEntry | undefined;
    submenu?: ContextMenuSubmenuContextValue | undefined;
  } = {},
) {
  const moveActive = vi.fn();
  const focusFirst = vi.fn();
  const focusLast = vi.fn();
  const typeahead = vi.fn();
  const closeAll = vi.fn();
  const ctx = {
    horizontal: overrides.horizontal ?? false,
    activeEntry: () => overrides.active,
    moveActive,
    focusFirst,
    focusLast,
    typeahead,
    submenu: overrides.submenu,
    closeAll,
  };

  const dispatch = (event: KeyboardEvent) => {
    handleMenuKeyDown(event, ctx);
    return event;
  };

  return {
    ctx,
    dispatch,
    moveActive,
    focusFirst,
    focusLast,
    typeahead,
    closeAll,
  };
}

function fakeSubmenu(closeParentOnEsc: boolean, closeSubmenu = vi.fn()) {
  return {
    closeParentOnEsc: () => closeParentOnEsc,
    closeSubmenu,
  } as unknown as ContextMenuSubmenuContextValue;
}

describe("handleMenuKeyDown 方向键", () => {
  it("ArrowDown / ArrowUp 移动高亮并阻止默认行为", () => {
    const { dispatch, moveActive } = setup();

    const down = dispatch(key("ArrowDown"));
    expect(moveActive).toHaveBeenLastCalledWith(1);
    expect(down.defaultPrevented).toBe(true);

    const up = dispatch(key("ArrowUp"));
    expect(moveActive).toHaveBeenLastCalledWith(-1);
    expect(up.defaultPrevented).toBe(true);
  });

  it("横向菜单里 ArrowRight / ArrowLeft 移动高亮", () => {
    const { dispatch, moveActive } = setup({ horizontal: true });

    dispatch(key("ArrowRight"));
    expect(moveActive).toHaveBeenLastCalledWith(1);

    dispatch(key("ArrowLeft"));
    expect(moveActive).toHaveBeenLastCalledWith(-1);
  });

  it("纵向菜单里 ArrowRight 在高亮项有子菜单时打开它", () => {
    const openPopup = vi.fn();
    const active = entry({ hasPopup: () => true, openPopup });
    const { dispatch } = setup({ active });

    const event = dispatch(key("ArrowRight"));

    expect(openPopup).toHaveBeenCalledWith("list-navigation", event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("纵向菜单里 ArrowRight 遇到非子菜单项时不做任何事", () => {
    const { dispatch } = setup({ active: entry() });

    const event = dispatch(key("ArrowRight"));

    expect(event.defaultPrevented).toBe(false);
  });

  it("没有高亮项时 ArrowRight 是空操作", () => {
    const { dispatch } = setup({ active: undefined });

    const event = dispatch(key("ArrowRight"));

    expect(event.defaultPrevented).toBe(false);
  });

  it("纵向菜单里 ArrowLeft 有关闭子菜单的能力时退回父菜单并阻止冒泡", () => {
    const closeSubmenu = vi.fn();
    const submenu = fakeSubmenu(false, closeSubmenu);
    const { dispatch } = setup({ submenu });

    const event = dispatch(key("ArrowLeft"));

    expect(closeSubmenu).toHaveBeenCalledWith("list-navigation", event, true);
    expect(event.defaultPrevented).toBe(true);
    // stopPropagation 之后 cancelBubble 为 true
    expect(event.cancelBubble).toBe(true);
  });

  it("根菜单（没有父浮层）里 ArrowLeft 是空操作", () => {
    const { dispatch } = setup();

    const event = dispatch(key("ArrowLeft"));

    expect(event.defaultPrevented).toBe(false);
  });
});

describe("handleMenuKeyDown Home / End / Enter", () => {
  it("Home 跳到第一项、End 跳到最后一项", () => {
    const { dispatch, focusFirst, focusLast } = setup();

    dispatch(key("Home"));
    expect(focusFirst).toHaveBeenCalledTimes(1);

    dispatch(key("End"));
    expect(focusLast).toHaveBeenCalledTimes(1);
  });

  it("Enter / Space 激活高亮项", () => {
    const activate = vi.fn();
    const { dispatch } = setup({ active: entry({ activate }) });

    dispatch(key("Enter"));
    dispatch(key(" "));

    expect(activate).toHaveBeenCalledTimes(2);
  });

  it("禁用项不会被激活", () => {
    const activate = vi.fn();
    const { dispatch } = setup({
      active: entry({ activate, disabled: () => true }),
    });

    dispatch(key("Enter"));

    expect(activate).not.toHaveBeenCalled();
  });

  it("没有高亮项时 Enter 不报错也不激活", () => {
    const { dispatch } = setup({ active: undefined });

    expect(() => dispatch(key("Enter"))).not.toThrow();
  });
});

describe("handleMenuKeyDown Escape / Tab", () => {
  it("根菜单 Escape 关闭全部并阻止冒泡", () => {
    const { dispatch, closeAll } = setup();

    const event = dispatch(key("Escape"));

    expect(closeAll).toHaveBeenCalledWith("escape-key", event);
    expect(event.cancelBubble).toBe(true);
  });

  it("子菜单 Escape 默认只关当前子菜单", () => {
    const closeSubmenu = vi.fn();
    const submenu = fakeSubmenu(false, closeSubmenu);
    const { dispatch, closeAll } = setup({ submenu });

    const event = dispatch(key("Escape"));

    expect(closeSubmenu).toHaveBeenCalledWith("escape-key", event, true);
    expect(closeAll).not.toHaveBeenCalled();
  });

  it("closeParentOnEsc 为 true 时 Escape 关掉整个菜单", () => {
    const closeSubmenu = vi.fn();
    const submenu = fakeSubmenu(true, closeSubmenu);
    const { dispatch, closeAll } = setup({ submenu });

    const event = dispatch(key("Escape"));

    expect(closeAll).toHaveBeenCalledWith("escape-key", event);
    expect(closeSubmenu).not.toHaveBeenCalled();
  });

  it("Tab 关闭菜单且原因是 focus-out", () => {
    const { dispatch, closeAll } = setup();

    const event = dispatch(key("Tab"));

    expect(closeAll).toHaveBeenCalledWith("focus-out", event);
    expect(event.defaultPrevented).toBe(true);
  });
});

describe("handleMenuKeyDown 字符导航", () => {
  it("可打印字符交给 typeahead", () => {
    const { dispatch, typeahead } = setup();

    dispatch(key("a"));

    expect(typeahead).toHaveBeenCalledWith("a");
  });

  it("带 Ctrl / Meta / Alt 的组合键不参与字符导航", () => {
    const { dispatch, typeahead } = setup();

    dispatch(key("a", { ctrlKey: true }));
    dispatch(key("a", { metaKey: true }));
    dispatch(key("a", { altKey: true }));

    expect(typeahead).not.toHaveBeenCalled();
  });

  it("多字符按键名（F1 / Enter 等）不参与字符导航", () => {
    const { dispatch, typeahead } = setup();

    dispatch(key("F1"));

    expect(typeahead).not.toHaveBeenCalled();
  });
});
