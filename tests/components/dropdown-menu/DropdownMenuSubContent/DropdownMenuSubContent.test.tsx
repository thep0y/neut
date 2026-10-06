import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContextMenuSubmenuContext } from "~/components/context-menu/context-menu.context";
import type {
  ContextMenuContextValue,
  ContextMenuPopupContextValue,
  ContextMenuSubmenuContextValue,
} from "~/components/context-menu/context-menu.types";
import { DropdownMenu } from "~/components/dropdown-menu/DropdownMenu/DropdownMenu";
import { DropdownMenuContent } from "~/components/dropdown-menu/DropdownMenuContent/DropdownMenuContent";
import { DropdownMenuItem } from "~/components/dropdown-menu/DropdownMenuItem/DropdownMenuItem";
import { DropdownMenuSub } from "~/components/dropdown-menu/DropdownMenuSub/DropdownMenuSub";
import { DropdownMenuSubContent } from "~/components/dropdown-menu/DropdownMenuSubContent/DropdownMenuSubContent";
import { DropdownMenuSubTrigger } from "~/components/dropdown-menu/DropdownMenuSubTrigger/DropdownMenuSubTrigger";
import { DropdownMenuTrigger } from "~/components/dropdown-menu/DropdownMenuTrigger/DropdownMenuTrigger";
import { slot, waitForMount } from "../test-utils";

function subTrigger(): HTMLElement {
  return slot("dropdown-menu-sub-trigger")!;
}

function subContent(): HTMLElement | null {
  return slot("dropdown-menu-sub-content");
}

function renderSubMenu(
  options: { onPointerEnter?: () => void; onPointerLeave?: () => void } = {},
) {
  return render(() => (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>打开菜单</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>普通项</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>更多</DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            onPointerEnter={options.onPointerEnter}
            onPointerLeave={options.onPointerLeave}
          >
            <DropdownMenuItem>子项</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  ));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("DropdownMenuSubContent - 指针进出", () => {
  it("指针移入子浮层取消父级已排期的关闭，移出后再排期关闭", async () => {
    const onPointerEnter = vi.fn();
    const onPointerLeave = vi.fn();
    renderSubMenu({ onPointerEnter, onPointerLeave });
    await waitForMount();
    fireEvent.click(subTrigger());
    await vi.advanceTimersByTimeAsync(0);
    expect(subContent()).toBeInTheDocument();

    fireEvent.pointerLeave(subTrigger());
    fireEvent.pointerEnter(subContent()!);
    await vi.advanceTimersByTimeAsync(200);
    expect(subContent()).toBeInTheDocument();

    fireEvent.pointerLeave(subContent()!);
    await vi.advanceTimersByTimeAsync(100);

    expect(subContent()).toBeNull();
    expect(onPointerEnter).toHaveBeenCalledTimes(1);
    expect(onPointerLeave).toHaveBeenCalledTimes(1);
  });
});

/**
 * 关闭后"把焦点还给父浮层"的那段 effect 有三条早退。
 * 真实菜单树里很难构造"根菜单已关闭但子菜单还在关"和"itemId 尚未登记"这两个
 * 时序，因此这里用真实的 submenu context 形状构造最小场景，只驱动这条 effect。
 */
describe("DropdownMenuSubContent - 关闭后焦点归还的守卫（假子菜单上下文）", () => {
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
        <DropdownMenuSubContent>
          <DropdownMenuItem>子项</DropdownMenuItem>
        </DropdownMenuSubContent>
      </ContextMenuSubmenuContext.Provider>
    ));

    return { setOpen, setRootOpen, setItemId, setActiveId, focus };
  }

  it("根菜单已关闭时关闭子菜单不抢父浮层焦点", () => {
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
    expect(h.focus).not.toHaveBeenCalled();
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
