import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContextMenuContext } from "~/components/context-menu/ContextMenu/ContextMenu.context";
import {
  ContextMenuPopupContext,
  useContextMenuSubmenu,
} from "~/components/context-menu/context-menu.context";
import { ContextMenuSub } from "~/components/context-menu/ContextMenuSub/ContextMenuSub";
import type {
  ContextMenuContextValue,
  ContextMenuOpenPopupState,
  ContextMenuPopupContextValue,
  ContextMenuSubmenuContextValue,
} from "~/components/context-menu/context-menu.types";

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
    contentId: "content",
    finalFocus: () => true,
    setFinalFocus: vi.fn(),
    openAt: vi.fn(),
    closeAll: vi.fn(),
    registerMenuElement: () => () => {},
    isInsideMenu: () => false,
    ...overrides,
  };
}

function setup(
  subProps: Record<string, unknown> = {},
  rootOverrides: Partial<ContextMenuContextValue> = {},
) {
  let ctx!: ContextMenuSubmenuContextValue;
  function Probe() {
    ctx = useContextMenuSubmenu("Probe");
    return null;
  }

  const root = fakeRoot(rootOverrides);
  const [openPopupState, setOpenPopupState] =
    createSignal<ContextMenuOpenPopupState>();
  const openPopup = vi.fn((id: string, reason: string, event?: Event) =>
    setOpenPopupState({ id, reason, event } as ContextMenuOpenPopupState),
  );
  const closeOpenPopup = vi.fn(() => setOpenPopupState(undefined));
  const setActiveId = vi.fn();
  const popupFocus = vi.fn();

  const parentPopup = {
    openPopupState,
    openPopup,
    closeOpenPopup,
    setActiveId,
    popup: () => ({ focus: popupFocus }),
    activeId: () => undefined,
    menuId: "parent",
  } as unknown as ContextMenuPopupContextValue;

  const rendered = render(() => (
    <ContextMenuContext.Provider value={root}>
      <ContextMenuPopupContext.Provider value={parentPopup}>
        <ContextMenuSub {...subProps}>
          <Probe />
        </ContextMenuSub>
      </ContextMenuPopupContext.Provider>
    </ContextMenuContext.Provider>
  ));

  return {
    ctx: () => ctx,
    root,
    parentPopup,
    openPopup,
    closeOpenPopup,
    setActiveId,
    popupFocus,
    openPopupState,
    setOpenPopupState,
    rendered,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ContextMenuSub - 状态与默认值", () => {
  it("默认关闭，disabled / closeParentOnEsc 默认为假", () => {
    const harness = setup();

    expect(harness.ctx().open()).toBe(false);
    expect(harness.ctx().disabled()).toBe(false);
    expect(harness.ctx().closeParentOnEsc()).toBe(false);
  });

  it("defaultOpen 时初始打开", () => {
    const harness = setup({ defaultOpen: true });

    expect(harness.ctx().open()).toBe(true);
  });

  it("loopFocus / orientation / highlightItemOnHover 回退到根组件", () => {
    const harness = setup(
      {},
      {
        loopFocus: () => false,
        orientation: () => "horizontal",
        highlightItemOnHover: () => false,
      },
    );

    expect(harness.ctx().loopFocus()).toBe(false);
    expect(harness.ctx().orientation()).toBe("horizontal");
    expect(harness.ctx().highlightItemOnHover()).toBe(false);
  });

  it("显式传入时覆盖根组件默认值", () => {
    const harness = setup({
      loopFocus: true,
      orientation: "vertical",
      highlightItemOnHover: true,
      closeParentOnEsc: true,
      disabled: true,
    });

    expect(harness.ctx().loopFocus()).toBe(true);
    expect(harness.ctx().orientation()).toBe("vertical");
    expect(harness.ctx().highlightItemOnHover()).toBe(true);
    expect(harness.ctx().closeParentOnEsc()).toBe(true);
    expect(harness.ctx().disabled()).toBe(true);
  });
});

describe("ContextMenuSub - setOpen", () => {
  it("非受控下写入内部状态并回调事件详情", () => {
    const onOpenChange = vi.fn();
    const harness = setup({ onOpenChange });

    harness.ctx().setOpen(true, "trigger-hover");

    expect(harness.ctx().open()).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: "trigger-hover" }),
    );
  });

  it("受控下只回调，内部状态不变", () => {
    const onOpenChange = vi.fn();
    const harness = setup({ open: false, onOpenChange });

    harness.ctx().setOpen(true, "trigger-press");

    expect(harness.ctx().open()).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });
});

describe("ContextMenuSub - openSubmenu", () => {
  it("登记到父浮层并打开自己", () => {
    const onOpenChange = vi.fn();
    const harness = setup({ onOpenChange });
    harness.ctx().setItemId("item-1");

    harness.ctx().openSubmenu("trigger-press");

    expect(harness.openPopup).toHaveBeenCalledWith(
      "item-1",
      "trigger-press",
      undefined,
    );
    expect(harness.ctx().open()).toBe(true);
    expect(onOpenChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: "trigger-press" }),
    );
  });

  it("disabled 时不打开", () => {
    const harness = setup({ disabled: true });
    harness.ctx().setItemId("item-1");

    harness.ctx().openSubmenu("trigger-press");

    expect(harness.openPopup).not.toHaveBeenCalled();
    expect(harness.ctx().open()).toBe(false);
  });

  it("还没登记 itemId 时不打开", () => {
    const harness = setup();

    harness.ctx().openSubmenu("trigger-press");

    expect(harness.openPopup).not.toHaveBeenCalled();
  });

  it("已经打开时不重复登记与回调", () => {
    const onOpenChange = vi.fn();
    const harness = setup({ defaultOpen: true, onOpenChange });
    harness.ctx().setItemId("item-1");

    harness.ctx().openSubmenu("trigger-hover");

    expect(harness.openPopup).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("ContextMenuSub - closeSubmenu", () => {
  it("打开状态下以给定原因关闭，并清理父浮层登记", () => {
    const onOpenChange = vi.fn();
    const harness = setup({ defaultOpen: true, onOpenChange });
    harness.ctx().setItemId("item-1");
    harness.setOpenPopupState({
      id: "item-1",
      reason: "trigger-press",
      event: undefined,
    });

    harness.ctx().closeSubmenu("list-navigation");

    expect(harness.ctx().open()).toBe(false);
    expect(harness.closeOpenPopup).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "list-navigation" }),
    );
  });

  it("父浮层登记的不是自己时不越权清理", () => {
    const harness = setup({ defaultOpen: true });
    harness.ctx().setItemId("item-1");
    harness.setOpenPopupState({
      id: "other",
      reason: "trigger-press",
      event: undefined,
    });

    harness.ctx().closeSubmenu("sibling-open");

    expect(harness.closeOpenPopup).not.toHaveBeenCalled();
  });

  it("已经关闭时不再回调", () => {
    const onOpenChange = vi.fn();
    const harness = setup({ onOpenChange });

    harness.ctx().closeSubmenu("escape-key");

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("focusTrigger 时把焦点还给父浮层并重新高亮触发器", () => {
    const harness = setup({ defaultOpen: true });
    harness.ctx().setItemId("item-1");

    harness.ctx().closeSubmenu("escape-key", undefined, true);

    expect(harness.setActiveId).toHaveBeenCalledWith("item-1");
    expect(harness.popupFocus).toHaveBeenCalledWith({ preventScroll: true });
  });
});

describe("ContextMenuSub - 悬停延迟关闭", () => {
  it("默认排期 100ms 后以 trigger-hover 关闭", () => {
    const onOpenChange = vi.fn();
    const harness = setup({ defaultOpen: true, onOpenChange });

    harness.ctx().scheduleClose();

    vi.advanceTimersByTime(99);
    expect(harness.ctx().open()).toBe(true);

    vi.advanceTimersByTime(1);

    expect(harness.ctx().open()).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "trigger-hover" }),
    );
  });

  it("传入的延迟小于下限时按 100ms 计（穿越间隙的容忍）", () => {
    const harness = setup({ defaultOpen: true });

    harness.ctx().scheduleClose(10);
    vi.advanceTimersByTime(99);

    expect(harness.ctx().open()).toBe(true);

    vi.advanceTimersByTime(1);

    expect(harness.ctx().open()).toBe(false);
  });

  it("传入更大的延迟时按传入值", () => {
    const harness = setup({ defaultOpen: true });

    harness.ctx().scheduleClose(300);
    vi.advanceTimersByTime(299);
    expect(harness.ctx().open()).toBe(true);

    vi.advanceTimersByTime(1);
    expect(harness.ctx().open()).toBe(false);
  });

  it("cancelClose 取消已排期的关闭", () => {
    const harness = setup({ defaultOpen: true });

    harness.ctx().scheduleClose();
    harness.ctx().cancelClose();
    vi.advanceTimersByTime(1000);

    expect(harness.ctx().open()).toBe(true);
  });

  it("重复 scheduleClose 只保留最新的定时器", () => {
    const harness = setup({ defaultOpen: true });

    harness.ctx().scheduleClose(200);
    harness.ctx().scheduleClose(100);
    vi.advanceTimersByTime(100);

    expect(harness.ctx().open()).toBe(false);
  });

  it("卸载时清理未触发的定时器", () => {
    const harness = setup({ defaultOpen: true });

    harness.ctx().scheduleClose(500);
    harness.rendered.unmount();
    vi.advanceTimersByTime(1000);

    expect(harness.ctx().open()).toBe(true);
  });
});

describe("ContextMenuSub - 触发器登记", () => {
  it("setTrigger / setItemId 可读写", () => {
    const harness = setup();
    const el = document.createElement("div");

    harness.ctx().setTrigger(el);
    harness.ctx().setItemId("item-1");

    expect(harness.ctx().trigger()).toBe(el);
    expect(harness.ctx().itemId()).toBe("item-1");
  });
});
