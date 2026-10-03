import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ContextMenuChangeEventDetails } from "~/components/context-menu/context-menu.types";
import { DropdownMenu } from "~/components/dropdown-menu/DropdownMenu/DropdownMenu";
import { DropdownMenuContent } from "~/components/dropdown-menu/DropdownMenuContent/DropdownMenuContent";
import { DropdownMenuItem } from "~/components/dropdown-menu/DropdownMenuItem/DropdownMenuItem";
import { DropdownMenuSub } from "~/components/dropdown-menu/DropdownMenuSub/DropdownMenuSub";
import { DropdownMenuSubContent } from "~/components/dropdown-menu/DropdownMenuSubContent/DropdownMenuSubContent";
import { DropdownMenuSubTrigger } from "~/components/dropdown-menu/DropdownMenuSubTrigger/DropdownMenuSubTrigger";
import { DropdownMenuTrigger } from "~/components/dropdown-menu/DropdownMenuTrigger/DropdownMenuTrigger";
import { slot, waitForMount } from "../test-utils";

interface SubMenuOptions {
  label?: string;
  onOpenChange?: (
    open: boolean,
    details: ContextMenuChangeEventDetails,
  ) => void;
}

function renderSubMenu(options: SubMenuOptions = {}) {
  return render(() => (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>打开菜单</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>普通项</DropdownMenuItem>
        <DropdownMenuSub onOpenChange={options.onOpenChange}>
          <DropdownMenuSubTrigger label={options.label}>
            更多
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>子项</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  ));
}

function subTrigger(): HTMLElement {
  return slot("dropdown-menu-sub-trigger")!;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("DropdownMenuSubTrigger - 字符导航", () => {
  it("label 属性优先于子节点文本参与匹配", async () => {
    renderSubMenu({ label: "导出" });
    await waitForMount();

    fireEvent.keyDown(slot("dropdown-menu-content")!, { key: "导" });

    expect(subTrigger()).toHaveAttribute("data-highlighted", "");
  });
});

describe("DropdownMenuSubTrigger - 高亮切换关闭子菜单", () => {
  it("父浮层高亮切到别的项时以 list-navigation 关闭子菜单", async () => {
    const onOpenChange = vi.fn();
    renderSubMenu({ onOpenChange });
    await waitForMount();
    fireEvent.click(subTrigger());
    await vi.advanceTimersByTimeAsync(0);
    expect(slot("dropdown-menu-sub-content")).toBeInTheDocument();

    fireEvent.pointerEnter(slot("dropdown-menu-item")!);

    expect(slot("dropdown-menu-sub-content")).toBeNull();
    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "list-navigation" }),
    );
    expect(subTrigger()).toHaveAttribute("aria-expanded", "false");
  });
});
