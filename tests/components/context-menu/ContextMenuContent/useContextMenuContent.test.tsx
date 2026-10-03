import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createContextMenuPopupRuntime } from "~/components/context-menu/ContextMenuContent/useContextMenuContent";
import type {
  ContextMenuAlign,
  ContextMenuContextValue,
  ContextMenuItemEntry,
  ContextMenuSide,
  ContextMenuSubmenuContextValue,
} from "~/components/context-menu/context-menu.types";
import type { ReferenceElement } from "~/lib";

function fakeRoot(
  overrides: Partial<ContextMenuContextValue> = {},
): ContextMenuContextValue {
  return {
    open: () => true,
    disabled: () => false,
    loopFocus: () => true,
    orientation: () => "vertical",
    highlightItemOnHover: () => true,
    trigger: () => undefined,
    setTrigger: vi.fn(),
    anchor: () => undefined,
    contentId: "context-menu-content-test",
    finalFocus: () => true,
    setFinalFocus: vi.fn(),
    openAt: vi.fn(),
    closeAll: vi.fn(),
    registerMenuElement: () => () => {},
    isInsideMenu: () => false,
    ...overrides,
  };
}

function entry(
  id: string,
  options: { disabled?: boolean; hasPopup?: boolean } = {},
): ContextMenuItemEntry {
  const element = document.createElement("div");
  element.scrollIntoView = vi.fn();
  document.body.appendChild(element);
  return {
    id,
    element,
    disabled: () => options.disabled ?? false,
    label: () => id,
    hasPopup: () => options.hasPopup ?? false,
    activate: vi.fn(),
  };
}

interface SetupOptions {
  open?: boolean;
  isSubmenu?: boolean;
  loopFocus?: boolean;
  orientation?: "vertical" | "horizontal";
  highlightItemOnHover?: boolean;
  withSubmenu?: boolean;
  root?: Partial<ContextMenuContextValue>;
}

function setup(options: SetupOptions = {}) {
  const closeAll = vi.fn();
  const root = fakeRoot({ closeAll, ...options.root });
  const [open] = createSignal(options.open ?? true);
  const [reference] = createSignal<ReferenceElement>();
  const [_positionerElement, setPositionerElement] =
    createSignal<HTMLElement>();
  const [side] = createSignal<ContextMenuSide>("right");
  const [align] = createSignal<ContextMenuAlign>("start");

  const submenu = options.withSubmenu
    ? ({
        closeParentOnEsc: () => false,
      } as unknown as ContextMenuSubmenuContextValue)
    : undefined;

  const { result, cleanup } = renderHook(() =>
    createContextMenuPopupRuntime({
      root,
      open,
      isSubmenu: options.isSubmenu ?? false,
      reference,
      side,
      align,
      sideOffset: () => 0,
      alignOffset: () => 4,
      collisionPadding: () => 5,
      dir: () => undefined,
      ...(options.loopFocus !== undefined
        ? { loopFocus: () => options.loopFocus! }
        : {}),
      ...(options.orientation !== undefined
        ? { orientation: () => options.orientation! }
        : {}),
      ...(options.highlightItemOnHover !== undefined
        ? { highlightItemOnHover: () => options.highlightItemOnHover! }
        : {}),
      ...(submenu ? { submenu } : {}),
    }),
  );

  return {
    result,
    root,
    closeAll,
    cleanup,
    setPositionerElement,
    submenu,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createContextMenuPopupRuntime - 上下文", () => {
  it("弹出上下文携带 root / menuId / isSubmenu", () => {
    const { result, root } = setup();

    expect(result.popupCtx.root).toBe(root);
    expect(result.popupCtx.isSubmenu).toBe(false);
    expect(result.popupCtx.parent).toBeUndefined();
    expect(result.popupCtx.menuId).toMatch(/^context-menu-popup-/);
  });

  it("子菜单运行时带上父浮层与 submenu 上下文", () => {
    const parent = { menuId: "parent" } as never;
    const closeAll = vi.fn();
    const root = fakeRoot({ closeAll });
    const [open] = createSignal(false);
    const [reference] = createSignal<ReferenceElement>();
    const [side] = createSignal<ContextMenuSide>("right");
    const [align] = createSignal<ContextMenuAlign>("start");
    const submenu = {
      closeParentOnEsc: () => true,
    } as unknown as ContextMenuSubmenuContextValue;

    const { result } = renderHook(() =>
      createContextMenuPopupRuntime({
        root,
        open,
        parent,
        isSubmenu: true,
        reference,
        side,
        align,
        sideOffset: () => 0,
        alignOffset: () => 0,
        collisionPadding: () => 0,
        dir: () => undefined,
        submenu,
      }),
    );

    expect(result.popupCtx.isSubmenu).toBe(true);
    expect(result.popupCtx.parent).toBe(parent);
    expect(result.popupCtx.submenu).toBe(submenu);
  });

  it("loopFocus / orientation / highlightItemOnHover 缺省回退到 root，显式传入可覆盖", () => {
    const fallback = setup({ root: { loopFocus: () => false } });
    expect(fallback.result.popupCtx.highlightItemOnHover()).toBe(true);

    const overridden = setup({
      loopFocus: false,
      orientation: "horizontal",
      highlightItemOnHover: false,
    });
    expect(overridden.result.popupCtx.highlightItemOnHover()).toBe(false);
  });
});

describe("createContextMenuPopupRuntime - 菜单项集合", () => {
  it("注册后按 DOM 顺序暴露，并排除 disabled 项", () => {
    const { result } = setup();
    const second = entry("b");
    const first = entry("a");
    const disabled = entry("c", { disabled: true });
    // 注册顺序刻意与 DOM 顺序不同
    result.popupCtx.registerItem(second);
    result.popupCtx.registerItem(first);
    result.popupCtx.registerItem(disabled);

    expect(result.popupCtx.items().map((item) => item.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("highlight 设置高亮；切到别的项时关闭已展开的子菜单", () => {
    const { result } = setup();
    const item = entry("a");
    result.popupCtx.registerItem(item);
    result.popupCtx.openPopup("a", "trigger-hover");
    const openState = result.popupCtx.openPopupState;

    result.popupCtx.highlight("a");
    expect(result.popupCtx.activeId()).toBe("a");
    expect(openState()?.id).toBe("a");

    result.popupCtx.highlight("b");

    expect(result.popupCtx.activeId()).toBe("b");
    expect(openState()).toBeUndefined();
  });

  it("closeOpenPopup 单独清空子菜单状态", () => {
    const { result } = setup();
    result.popupCtx.openPopup("a", "trigger-hover");

    result.popupCtx.closeOpenPopup();

    expect(result.popupCtx.openPopupState()).toBeUndefined();
  });
});

describe("createContextMenuPopupRuntime - 键盘", () => {
  it("方向键移动高亮，Escape 关闭整棵菜单", () => {
    const { result, closeAll } = setup();
    result.popupCtx.registerItem(entry("a"));
    result.popupCtx.registerItem(entry("b"));
    result.popupCtx.focusFirst();

    result.onKeyDown(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    expect(result.popupCtx.activeId()).toBe("b");

    const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
    result.onKeyDown(escapeEvent);

    expect(closeAll).toHaveBeenCalledWith("escape-key", escapeEvent);
  });

  it("字符导航把高亮移到匹配项", () => {
    const { result } = setup();
    result.popupCtx.registerItem({ ...entry("a"), label: () => "复制" });
    result.popupCtx.registerItem({ ...entry("b"), label: () => "粘贴" });

    result.onKeyDown(new KeyboardEvent("keydown", { key: "粘" }));

    expect(result.popupCtx.activeId()).toBe("b");
  });
});

describe("createContextMenuPopupRuntime - 打开收尾", () => {
  it("打开后聚焦 popup 并把高亮落到第一项", async () => {
    const { result } = setup();
    const popup = document.createElement("div");
    const focus = vi.spyOn(popup, "focus");
    result.popupCtx.registerItem(entry("a"));
    result.setPopupEl(popup);

    result.setupOnOpen();
    await Promise.resolve();

    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(result.popupCtx.activeId()).toBe("a");
  });

  it("关闭状态下 setupOnOpen 不做任何事", async () => {
    const { result } = setup({ open: false });
    const popup = document.createElement("div");
    const focus = vi.spyOn(popup, "focus");
    result.setPopupEl(popup);

    result.setupOnOpen();
    await Promise.resolve();

    expect(focus).not.toHaveBeenCalled();
  });

  it("已有高亮时 setupOnOpen 不再重置到第一项", async () => {
    const { result } = setup();
    result.popupCtx.registerItem(entry("a"));
    result.popupCtx.registerItem(entry("b"));
    result.popupCtx.setActiveId("b");
    result.setPopupEl(document.createElement("div"));

    result.setupOnOpen();
    await Promise.resolve();

    expect(result.popupCtx.activeId()).toBe("b");
  });

  it("popup 元素缺失时跳过着焦但依旧完成首项高亮", async () => {
    const { result } = setup();
    result.popupCtx.registerItem(entry("a"));

    result.setupOnOpen();
    await Promise.resolve();

    expect(result.popupCtx.activeId()).toBe("a");
  });
});

describe("createContextMenuPopupRuntime - 定位与清理", () => {
  it("初始未定位、无可用高度", () => {
    const { result } = setup();

    expect(result.pos.isPositioned()).toBe(false);
    expect(result.availableHeight()).toBeUndefined();
  });

  it("卸载时释放 typeahead 资源", async () => {
    const { result, cleanup } = setup();
    result.popupCtx.registerItem(entry("a"));

    cleanup();
    await Promise.resolve();

    expect(result.popupCtx.activeId()).toBeUndefined();
  });

  it("暴露 positioner 元素访问器", () => {
    const { result } = setup();
    const el = document.createElement("div");

    result.setPositionerEl(el);

    expect(result.positionerEl()).toBe(el);
  });
});

describe("createContextMenuPopupRuntime - setPopup 转发", () => {
  it("popupCtx.setPopup 与运行时 setPopupEl 指向同一个信号", () => {
    const { result } = setup();
    const el = document.createElement("div");

    result.popupCtx.setPopup(el);

    expect(result.popupEl()).toBe(el);
  });
});
