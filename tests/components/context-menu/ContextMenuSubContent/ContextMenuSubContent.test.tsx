import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContextMenu } from "~/components/context-menu/ContextMenu/ContextMenu";
import { ContextMenuContent } from "~/components/context-menu/ContextMenuContent/ContextMenuContent";
import { ContextMenuItem } from "~/components/context-menu/ContextMenuItem/ContextMenuItem";
import { ContextMenuSub } from "~/components/context-menu/ContextMenuSub/ContextMenuSub";
import { ContextMenuSubContent } from "~/components/context-menu/ContextMenuSubContent/ContextMenuSubContent";
import { ContextMenuSubTrigger } from "~/components/context-menu/ContextMenuSubTrigger/ContextMenuSubTrigger";
import { ContextMenuTrigger } from "~/components/context-menu/ContextMenuTrigger/ContextMenuTrigger";
import { ContextMenuSubmenuContext } from "~/components/context-menu/context-menu.context";
import type {
  ContextMenuContextValue,
  ContextMenuPopupContextValue,
  ContextMenuSubmenuContextValue,
} from "~/components/context-menu/context-menu.types";
import { slot, waitForMount } from "../test-utils";

function subTrigger(): HTMLElement {
  return slot("context-menu-sub-trigger")!;
}

function subContent(): HTMLElement | null {
  return slot("context-menu-sub-content");
}

function renderSubMenu(
  options: {
    onOpenChange?: (open: boolean, details?: unknown) => void;
    subContentProps?: Record<string, unknown>;
  } = {},
) {
  return render(() => (
    <ContextMenu defaultOpen>
      <ContextMenuTrigger>区域</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>普通项</ContextMenuItem>
        <ContextMenuSub onOpenChange={options.onOpenChange}>
          <ContextMenuSubTrigger>更多</ContextMenuSubTrigger>
          <ContextMenuSubContent {...(options.subContentProps ?? {})}>
            <ContextMenuItem>子项</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  ));
}

function openSubmenu() {
  fireEvent.click(subTrigger());
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ContextMenuSubContent - 渲染与 ARIA", () => {
  it("打开后渲染 role=menu 的子浮层", async () => {
    renderSubMenu();
    await waitForMount();
    openSubmenu();

    expect(subContent()).toHaveAttribute("role", "menu");
    expect(subContent()).toHaveAttribute(
      "data-slot",
      "context-menu-sub-content",
    );
    expect(subContent()).toHaveAttribute("data-side", "right");
    expect(subContent()).toHaveAttribute("data-align", "start");
  });

  it("class / style / 其余属性透传", async () => {
    renderSubMenu({
      subContentProps: {
        class: "my-sub",
        style: { color: "red" },
        "data-x": "1",
      },
    });
    await waitForMount();
    openSubmenu();

    expect(subContent()!.className).toContain("my-sub");
    expect(subContent()!.style.color).toBe("red");
    expect(subContent()).toHaveAttribute("data-x", "1");
  });

  it("以子菜单触发器为锚点完成定位", async () => {
    renderSubMenu();
    await waitForMount();
    subTrigger().getBoundingClientRect = () =>
      ({ left: 100, top: 100, width: 80, height: 20 }) as DOMRect;

    openSubmenu();
    await vi.advanceTimersByTimeAsync(0);

    const positioners = document.querySelectorAll<HTMLElement>(
      '[data-slot="context-menu-positioner"]',
    );
    // 根菜单的 positioner 先挂载，子菜单的后挂载
    expect(positioners[positioners.length - 1]!.style.opacity).toBe("1");
  });

  it("onKeyDown 外部回调与内部处理都会执行", async () => {
    const onKeyDown = vi.fn();
    renderSubMenu({ subContentProps: { onKeyDown } });
    await waitForMount();
    openSubmenu();

    fireEvent.keyDown(subContent()!, { key: "ArrowDown" });

    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });
});

describe("ContextMenuSubContent - 键盘退出", () => {
  it("Escape 默认只关闭当前子菜单并把焦点还给父浮层", async () => {
    const onOpenChange = vi.fn();
    renderSubMenu({ onOpenChange });
    await waitForMount();
    openSubmenu();

    const triggerId = subTrigger().id;
    fireEvent.keyDown(subContent()!, { key: "Escape" });

    expect(subContent()).toBeNull();
    expect(slot("context-menu-content")).toBeInTheDocument();
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "escape-key" }),
    );
    expect(slot("context-menu-content")).toHaveAttribute(
      "aria-activedescendant",
      triggerId,
    );
    expect(document.activeElement).toBe(slot("context-menu-content"));
  });

  it("closeParentOnEsc 时 Escape 关闭整棵菜单", async () => {
    const onRootOpenChange = vi.fn();
    render(() => (
      <ContextMenu defaultOpen onOpenChange={onRootOpenChange}>
        <ContextMenuTrigger>区域</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuSub closeParentOnEsc>
            <ContextMenuSubTrigger>更多</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>子项</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    ));
    await waitForMount();
    openSubmenu();

    fireEvent.keyDown(subContent()!, { key: "Escape" });

    expect(onRootOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "escape-key" }),
    );
    expect(slot("context-menu-content")).toBeNull();
  });

  it("ArrowLeft 关闭子菜单（list-navigation）", async () => {
    const onOpenChange = vi.fn();
    renderSubMenu({ onOpenChange });
    await waitForMount();
    openSubmenu();

    fireEvent.keyDown(subContent()!, { key: "ArrowLeft" });

    expect(subContent()).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "list-navigation" }),
    );
  });
});

describe("ContextMenuSubContent - 指针进出", () => {
  it("指针移入子浮层取消父级已排期的关闭", async () => {
    renderSubMenu();
    await waitForMount();
    openSubmenu();

    fireEvent.pointerLeave(subTrigger());
    fireEvent.pointerEnter(subContent()!);
    await vi.advanceTimersByTimeAsync(200);

    expect(subContent()).toBeInTheDocument();
  });

  it("指针移出子浮层排期关闭", async () => {
    renderSubMenu();
    await waitForMount();
    openSubmenu();

    fireEvent.pointerLeave(subContent()!);
    await vi.advanceTimersByTimeAsync(100);

    expect(subContent()).toBeNull();
  });

  it("外部 onPointerEnter / onPointerLeave 会被调用", async () => {
    const onPointerEnter = vi.fn();
    const onPointerLeave = vi.fn();
    renderSubMenu({ subContentProps: { onPointerEnter, onPointerLeave } });
    await waitForMount();
    openSubmenu();

    fireEvent.pointerEnter(subContent()!);
    fireEvent.pointerLeave(subContent()!);

    expect(onPointerEnter).toHaveBeenCalledTimes(1);
    expect(onPointerLeave).toHaveBeenCalledTimes(1);
  });
});

describe("ContextMenuSubContent - 关闭后焦点归还的守卫（假子菜单上下文）", () => {
  function fakeHarness() {
    const [open, setOpen] = createSignal(false);
    const [rootOpen, setRootOpen] = createSignal(true);
    const [itemId, setItemId] = createSignal<string | undefined>(undefined);
    const setActiveId = vi.fn();
    const focus = vi.fn();

    const parentPopup = {
      setActiveId,
      popup: () => ({ focus }),
    } as unknown as ContextMenuPopupContextValue;

    const root = {
      open: rootOpen,
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
    } as unknown as ContextMenuContextValue;

    const submenu = {
      root,
      parentPopup,
      open,
      setOpen: vi.fn(),
      disabled: () => false,
      closeParentOnEsc: () => false,
      loopFocus: () => true,
      orientation: () => "vertical",
      highlightItemOnHover: () => true,
      trigger: () => undefined,
      setTrigger: vi.fn(),
      itemId,
      setItemId,
      openSubmenu: vi.fn(),
      closeSubmenu: vi.fn(),
      scheduleClose: vi.fn(),
      cancelClose: vi.fn(),
    } as unknown as ContextMenuSubmenuContextValue;

    render(() => (
      <ContextMenuSubmenuContext.Provider value={submenu}>
        <ContextMenuSubContent>
          <ContextMenuItem>子项</ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSubmenuContext.Provider>
    ));

    return { setOpen, setRootOpen, setItemId, setActiveId, focus };
  }

  it("关闭子菜单时如果根菜单也已关闭，则不抢父浮层焦点", () => {
    const h = fakeHarness();

    h.setOpen(true);
    h.setRootOpen(false);
    h.setOpen(false);

    expect(h.setActiveId).not.toHaveBeenCalled();
    expect(h.focus).not.toHaveBeenCalled();
  });

  it("还没登记 itemId 时关闭子菜单不会归还焦点", () => {
    const h = fakeHarness();

    h.setOpen(true);
    h.setOpen(false);

    expect(h.setActiveId).not.toHaveBeenCalled();
  });

  it("正常关闭时重新高亮触发器并把焦点还给父浮层", () => {
    const h = fakeHarness();

    h.setItemId("item-1");
    h.setOpen(true);
    h.setOpen(false);

    expect(h.setActiveId).toHaveBeenCalledWith("item-1");
    expect(h.focus).toHaveBeenCalledWith({ preventScroll: true });
  });
});
