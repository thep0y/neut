import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import {
  createHighlight,
  resolveNextActiveIndex,
} from "~/components/context-menu/ContextMenuContent/context-menu.highlight";
import type { ContextMenuItemEntry } from "~/components/context-menu/context-menu.types";

function entry(id: string, options: { disabled?: boolean } = {}) {
  const element = document.createElement("div");
  document.body.appendChild(element);
  const scrollIntoView = vi.fn();
  element.scrollIntoView = scrollIntoView;
  return {
    id,
    element,
    disabled: () => options.disabled ?? false,
    label: () => id,
    hasPopup: () => false,
    activate: vi.fn(),
    scrollIntoView,
  } as unknown as ContextMenuItemEntry & {
    scrollIntoView: ReturnType<typeof vi.fn>;
  };
}

function setup(
  options: {
    entries?: ReturnType<typeof entry>[];
    loopFocus?: boolean;
    open?: boolean;
    openPopupId?: string;
  } = {},
) {
  const ordered = options.entries ?? [];
  const enabled = ordered.filter((item) => !item.disabled());
  const [loopFocus, setLoopFocus] = createSignal(options.loopFocus ?? true);
  const [open, setOpen] = createSignal(options.open ?? true);
  const [openPopupId, setOpenPopupId] = createSignal<string | undefined>(
    options.openPopupId,
  );
  const closeOpenPopup = vi.fn(() => setOpenPopupId(undefined));

  const hook = renderHook(() =>
    createHighlight({
      orderedItems: () => ordered,
      enabledItems: () => enabled,
      loopFocus,
      openPopupId,
      closeOpenPopup,
      open,
    }),
  );

  return { ...hook, setLoopFocus, setOpen, setOpenPopupId, closeOpenPopup };
}

describe("resolveNextActiveIndex", () => {
  it("空列表返回 -1", () => {
    expect(resolveNextActiveIndex(-1, 1, 0, true)).toBe(-1);
  });

  it("没有高亮时：向后从第一项、向前从最后一项开始", () => {
    expect(resolveNextActiveIndex(-1, 1, 4, true)).toBe(0);
    expect(resolveNextActiveIndex(-1, -1, 4, true)).toBe(3);
  });

  it("中间位置按方向推进", () => {
    expect(resolveNextActiveIndex(1, 1, 4, true)).toBe(2);
    expect(resolveNextActiveIndex(1, -1, 4, true)).toBe(0);
  });

  it("loopFocus 时首尾环形回绕", () => {
    expect(resolveNextActiveIndex(3, 1, 4, true)).toBe(0);
    expect(resolveNextActiveIndex(0, -1, 4, true)).toBe(3);
  });

  it("loopFocus 关闭时停在两端", () => {
    expect(resolveNextActiveIndex(3, 1, 4, false)).toBe(3);
    expect(resolveNextActiveIndex(0, -1, 4, false)).toBe(0);
  });
});

describe("createHighlight 高亮与滚动", () => {
  it("初始没有高亮项", () => {
    const { result } = setup({ entries: [entry("a")] });

    expect(result.activeId()).toBeUndefined();
    expect(result.activeEntry()).toBeUndefined();
  });

  it("设置高亮后能反查出对应项", () => {
    const a = entry("a");
    const b = entry("b");
    const { result } = setup({ entries: [a, b] });

    result.setActiveId("b");

    expect(result.activeId()).toBe("b");
    expect(result.activeEntry()).toBe(b);
  });

  it("高亮变化时把对应元素滚入视野", () => {
    const a = entry("a");
    const b = entry("b");
    const { result } = setup({ entries: [a, b] });

    result.setActiveId("b");

    expect(b.scrollIntoView).toHaveBeenCalledWith({ block: "nearest" });
    expect(a.scrollIntoView).not.toHaveBeenCalled();
  });

  it("高亮到不存在的 id 时不滚动也不报错", () => {
    const { result } = setup({ entries: [entry("a")] });

    expect(() => result.setActiveId("missing")).not.toThrow();
    expect(result.activeEntry()).toBeUndefined();
  });
});

describe("createHighlight 移动", () => {
  it("没有可选项时移动不改变高亮", () => {
    const { result } = setup({ entries: [entry("a", { disabled: true })] });

    result.moveActive(1);

    expect(result.activeId()).toBeUndefined();
  });

  it("没有高亮时向后移动落到第一项", () => {
    const { result } = setup({ entries: [entry("a"), entry("b")] });

    result.moveActive(1);

    expect(result.activeId()).toBe("a");
  });

  it("没有高亮时向前移动落到最后一项", () => {
    const { result } = setup({ entries: [entry("a"), entry("b")] });

    result.moveActive(-1);

    expect(result.activeId()).toBe("b");
  });

  it("跳过 disabled 项", () => {
    const { result } = setup({
      entries: [entry("a"), entry("b", { disabled: true }), entry("c")],
    });
    result.setActiveId("a");

    result.moveActive(1);

    expect(result.activeId()).toBe("c");
  });

  it("loopFocus 关闭时在末端停下", () => {
    const { result } = setup({
      entries: [entry("a"), entry("b")],
      loopFocus: false,
    });
    result.setActiveId("b");

    result.moveActive(1);

    expect(result.activeId()).toBe("b");
  });

  it("focusFirst / focusLast 跳到两端", () => {
    const { result } = setup({ entries: [entry("a"), entry("b"), entry("c")] });

    result.focusFirst();
    expect(result.activeId()).toBe("a");

    result.focusLast();
    expect(result.activeId()).toBe("c");
  });

  it("没有可选项时 focusFirst / focusLast 清空高亮", () => {
    const { result } = setup({ entries: [entry("a", { disabled: true })] });

    result.focusFirst();
    expect(result.activeId()).toBeUndefined();

    result.setActiveId("a");
    result.focusLast();
    expect(result.activeId()).toBeUndefined();
  });
});

describe("createHighlight 与子菜单联动", () => {
  it("高亮切到别的项时关闭已展开的子菜单", () => {
    const { result, closeOpenPopup } = setup({
      entries: [entry("a"), entry("b")],
      openPopupId: "a",
    });

    result.setActiveId("b");

    expect(closeOpenPopup).toHaveBeenCalledTimes(1);
  });

  it("高亮到当前已展开的那一项时不关闭子菜单", () => {
    const { result, closeOpenPopup } = setup({
      entries: [entry("a")],
      openPopupId: "a",
    });

    result.setActiveId("a");

    expect(closeOpenPopup).not.toHaveBeenCalled();
  });

  it("没有展开的子菜单时不会误关", () => {
    const { result, closeOpenPopup } = setup({ entries: [entry("a")] });

    result.setActiveId("a");

    expect(closeOpenPopup).not.toHaveBeenCalled();
  });

  it("浮层关闭时清空高亮并关掉子菜单", () => {
    const { result, closeOpenPopup, setOpen } = setup({
      entries: [entry("a")],
      openPopupId: "a",
    });
    result.setActiveId("a");
    closeOpenPopup.mockClear();

    setOpen(false);

    expect(result.activeId()).toBeUndefined();
    expect(closeOpenPopup).toHaveBeenCalledTimes(1);
  });
});
