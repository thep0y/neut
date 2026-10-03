import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContextMenu } from "~/components/context-menu/ContextMenu/ContextMenu";
import { ContextMenuCheckboxItem } from "~/components/context-menu/ContextMenuCheckboxItem/ContextMenuCheckboxItem";
import { ContextMenuContent } from "~/components/context-menu/ContextMenuContent/ContextMenuContent";
import { ContextMenuGroup } from "~/components/context-menu/ContextMenuGroup/ContextMenuGroup";
import { ContextMenuItem } from "~/components/context-menu/ContextMenuItem/ContextMenuItem";
import { ContextMenuLabel } from "~/components/context-menu/ContextMenuLabel/ContextMenuLabel";
import { ContextMenuRadioGroup } from "~/components/context-menu/ContextMenuRadioGroup/ContextMenuRadioGroup";
import { ContextMenuRadioItem } from "~/components/context-menu/ContextMenuRadioItem/ContextMenuRadioItem";
import { ContextMenuSeparator } from "~/components/context-menu/ContextMenuSeparator/ContextMenuSeparator";
import { ContextMenuShortcut } from "~/components/context-menu/ContextMenuShortcut/ContextMenuShortcut";
import { ContextMenuSub } from "~/components/context-menu/ContextMenuSub/ContextMenuSub";
import { ContextMenuSubContent } from "~/components/context-menu/ContextMenuSubContent/ContextMenuSubContent";
import { ContextMenuSubTrigger } from "~/components/context-menu/ContextMenuSubTrigger/ContextMenuSubTrigger";
import { ContextMenuTrigger } from "~/components/context-menu/ContextMenuTrigger/ContextMenuTrigger";
import { slot, slots, waitForMount } from "./test-utils";

function trigger(): HTMLElement {
  return slot("context-menu-trigger")!;
}

function content(): HTMLElement | null {
  return slot("context-menu-content");
}

function menuItems(): HTMLElement[] {
  return slots("context-menu-item");
}

/** 完整菜单树：覆盖分组、勾选、单选、快捷键、子菜单的真实组合 */
function renderFullMenu(rootProps: Record<string, unknown> = {}) {
  const onCheckedChange = vi.fn();
  const onValueChange = vi.fn();
  render(() => (
    <ContextMenu {...rootProps}>
      <ContextMenuTrigger>右键区域</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>操作</ContextMenuLabel>
          <ContextMenuItem>
            复制
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem inset variant="destructive">
            删除
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem
          defaultChecked
          onCheckedChange={onCheckedChange}
        >
          显示书签栏
        </ContextMenuCheckboxItem>
        <ContextMenuRadioGroup defaultValue="a" onValueChange={onValueChange}>
          <ContextMenuLabel>外观</ContextMenuLabel>
          <ContextMenuRadioItem value="a">浅色</ContextMenuRadioItem>
          <ContextMenuRadioItem value="b">深色</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  ));
  return { onCheckedChange, onValueChange };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ContextMenu 集成 - 打开、导航与关闭", () => {
  it("右键打开、方向键导航、Enter 激活后关闭并把焦点还给触发器", async () => {
    renderFullMenu();
    fireEvent.contextMenu(trigger(), { clientX: 10, clientY: 20 });
    await waitForMount();

    expect(content()).toBeInTheDocument();
    const popup = content()!;
    expect(popup).toHaveAttribute("aria-activedescendant", menuItems()[0]!.id);

    fireEvent.keyDown(popup, { key: "ArrowDown" });
    expect(popup).toHaveAttribute("aria-activedescendant", menuItems()[1]!.id);

    fireEvent.keyDown(popup, { key: "ArrowUp" });
    expect(popup).toHaveAttribute("aria-activedescendant", menuItems()[0]!.id);

    fireEvent.keyDown(popup, { key: "Enter" });

    expect(content()).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it("Escape 从根菜单关闭", async () => {
    const onOpenChange = vi.fn();
    renderFullMenu({ onOpenChange });
    fireEvent.contextMenu(trigger());
    await waitForMount();

    fireEvent.keyDown(content()!, { key: "Escape" });

    expect(content()).toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(
      false,
      expect.objectContaining({ reason: "escape-key" }),
    );
  });

  it("点击菜单外部关闭且焦点不回触发器", async () => {
    renderFullMenu();
    fireEvent.contextMenu(trigger());
    await waitForMount();

    fireEvent.pointerDown(document.body, { button: 0 });

    expect(content()).toBeNull();
    expect(document.activeElement).not.toBe(trigger());
  });

  it("点击菜单内部不关闭", async () => {
    renderFullMenu();
    fireEvent.contextMenu(trigger());
    await waitForMount();

    fireEvent.pointerDown(slot("context-menu-group")!, { button: 0 });

    expect(content()).toBeInTheDocument();
  });
});

describe("ContextMenu 集成 - 结构、ARIA 与状态", () => {
  it("分组、标签、分隔线与快捷键结构正确", async () => {
    renderFullMenu();
    fireEvent.contextMenu(trigger());
    await waitForMount();

    const group = slot("context-menu-group")!;
    const label = slot("context-menu-label")!;
    expect(group).toHaveAttribute("aria-labelledby", label.id);

    expect(slot("context-menu-separator")).toHaveAttribute("role", "separator");
    expect(slot("context-menu-shortcut")).toHaveTextContent("⌘C");

    expect(menuItems()[0]).toHaveAttribute("data-variant", "default");
    expect(menuItems()[1]).toHaveAttribute("data-variant", "destructive");
    expect(menuItems()[1]).toHaveAttribute("data-inset", "");
  });

  it("复选项勾选后菜单保持打开，单选项互斥选择", async () => {
    const { onCheckedChange, onValueChange } = renderFullMenu();
    fireEvent.contextMenu(trigger());
    await waitForMount();

    const checkbox = slot("context-menu-checkbox-item")!;
    expect(checkbox).toHaveAttribute("aria-checked", "true");

    fireEvent.click(checkbox);
    expect(checkbox).toHaveAttribute("aria-checked", "false");
    expect(onCheckedChange).toHaveBeenCalledWith(false, expect.anything());
    expect(content()).toBeInTheDocument();

    const radios = slots("context-menu-radio-item");
    fireEvent.click(radios[1]!);

    expect(radios[0]).toHaveAttribute("aria-checked", "false");
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
    expect(onValueChange).toHaveBeenCalledWith("b", expect.anything());
    expect(content()).toBeInTheDocument();
  });

  it("受控根：交互只回调，外部信号回写驱动 UI", async () => {
    const onOpenChange = vi.fn();
    const [open, setOpen] = createSignal(false);
    render(() => (
      <ContextMenu open={open()} onOpenChange={onOpenChange}>
        <ContextMenuTrigger>区域</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem>复制</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ));

    fireEvent.contextMenu(trigger());
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    expect(content()).toBeNull();

    setOpen(true);
    expect(content()).toBeInTheDocument();

    setOpen(false);
    expect(content()).toBeNull();
  });
});

describe("ContextMenu 集成 - 子菜单", () => {
  function renderSubs(
    options: {
      onOpenA?: (open: boolean, details?: unknown) => void;
      onOpenB?: (open: boolean, details?: unknown) => void;
    } = {},
  ) {
    render(() => (
      <ContextMenu defaultOpen>
        <ContextMenuTrigger>区域</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuSub onOpenChange={options.onOpenA}>
            <ContextMenuSubTrigger>A 更多</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>A-1</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSub onOpenChange={options.onOpenB}>
            <ContextMenuSubTrigger>B 更多</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>B-1</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    ));
  }

  function subTriggers(): HTMLElement[] {
    return slots("context-menu-sub-trigger");
  }

  function subContents(): HTMLElement[] {
    return slots("context-menu-sub-content");
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("悬停打开子菜单，关闭后把焦点还回父浮层", async () => {
    renderSubs();
    await waitForMount();

    fireEvent.pointerEnter(subTriggers()[0]!);
    await vi.advanceTimersByTimeAsync(100);

    expect(subContents()).toHaveLength(1);

    const [subTrigger] = subTriggers();
    fireEvent.keyDown(subContents()[0]!, { key: "Escape" });

    expect(subContents()).toHaveLength(0);
    expect(content()).toHaveAttribute("aria-activedescendant", subTrigger!.id);
    expect(document.activeElement).toBe(content());
  });

  it("打开第二个子菜单时第一个以 sibling-open 关闭（兄弟互斥）", async () => {
    const onOpenA = vi.fn();
    renderSubs({ onOpenA });
    await waitForMount();

    fireEvent.click(subTriggers()[0]!);
    expect(subContents()).toHaveLength(1);

    fireEvent.click(subTriggers()[1]!);

    expect(subContents()).toHaveLength(1);
    expect(onOpenA).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "sibling-open" }),
    );
  });

  it("受控子菜单：点击只回调，外部信号回写驱动 UI", async () => {
    const onOpenChange = vi.fn();
    const [open, setOpen] = createSignal(false);
    render(() => (
      <ContextMenu defaultOpen>
        <ContextMenuTrigger>区域</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuSub open={open()} onOpenChange={onOpenChange}>
            <ContextMenuSubTrigger>更多</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem>子项</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>
    ));
    await waitForMount();

    fireEvent.click(subTriggers()[0]!);
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    expect(subContents()).toHaveLength(0);

    setOpen(true);
    expect(subContents()).toHaveLength(1);
  });
});
