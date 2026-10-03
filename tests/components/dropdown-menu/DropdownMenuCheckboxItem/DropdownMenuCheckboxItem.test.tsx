import { fireEvent } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DropdownMenuCheckboxItem } from "~/components/dropdown-menu/DropdownMenuCheckboxItem/DropdownMenuCheckboxItem";
import { renderOpenMenu, slot, slots, waitForMount } from "../test-utils";

function item(): HTMLElement {
  return slot("dropdown-menu-checkbox-item")!;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DropdownMenuCheckboxItem - 状态属性", () => {
  it("inset / disabled 写入 data-* 与 aria-disabled", () => {
    renderOpenMenu(() => (
      <DropdownMenuCheckboxItem inset disabled>
        显示工具栏
      </DropdownMenuCheckboxItem>
    ));

    expect(item()).toHaveAttribute("data-inset", "");
    expect(item()).toHaveAttribute("data-disabled", "");
    expect(item()).toHaveAttribute("aria-disabled", "true");
  });

  it("未勾选时带 data-unchecked 且没有勾选图标", () => {
    renderOpenMenu(() => (
      <DropdownMenuCheckboxItem>显示工具栏</DropdownMenuCheckboxItem>
    ));

    expect(item()).toHaveAttribute("data-unchecked", "");
    expect(item()).not.toHaveAttribute("data-checked");
    expect(item().querySelector("svg")).toBeNull();
  });
});

describe("DropdownMenuCheckboxItem - 非受控切换", () => {
  it("点击写内部状态并回调，默认不关闭菜单", async () => {
    const onCheckedChange = vi.fn();
    renderOpenMenu(() => (
      <DropdownMenuCheckboxItem onCheckedChange={onCheckedChange}>
        显示工具栏
      </DropdownMenuCheckboxItem>
    ));
    await waitForMount();

    fireEvent.click(item());

    expect(item()).toHaveAttribute("aria-checked", "true");
    expect(item()).toHaveAttribute("data-checked", "");
    expect(item()).not.toHaveAttribute("data-unchecked");
    expect(item().querySelector("svg")).not.toBeNull();
    expect(onCheckedChange).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ reason: "item-press" }),
    );
    expect(slot("dropdown-menu-content")).toBeInTheDocument();
  });

  it("再次点击取消勾选", async () => {
    const onCheckedChange = vi.fn();
    renderOpenMenu(() => (
      <DropdownMenuCheckboxItem
        defaultChecked
        onCheckedChange={onCheckedChange}
      >
        显示工具栏
      </DropdownMenuCheckboxItem>
    ));
    await waitForMount();

    fireEvent.click(item());

    expect(item()).toHaveAttribute("aria-checked", "false");
    expect(onCheckedChange).toHaveBeenCalledWith(false, expect.anything());
  });
});

describe("DropdownMenuCheckboxItem - 阻断与关闭", () => {
  it("disabled 时点击不切换也不回调", async () => {
    const onCheckedChange = vi.fn();
    renderOpenMenu(() => (
      <DropdownMenuCheckboxItem disabled onCheckedChange={onCheckedChange}>
        显示工具栏
      </DropdownMenuCheckboxItem>
    ));
    await waitForMount();

    fireEvent.click(item());

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(item()).toHaveAttribute("aria-checked", "false");
  });

  it("用户 onClick 里 preventDefault 后不切换", async () => {
    const onCheckedChange = vi.fn();
    renderOpenMenu(() => (
      <DropdownMenuCheckboxItem
        onCheckedChange={onCheckedChange}
        onClick={(event) => event.preventDefault()}
      >
        显示工具栏
      </DropdownMenuCheckboxItem>
    ));
    await waitForMount();

    fireEvent.click(item());

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(item()).toHaveAttribute("aria-checked", "false");
  });

  it("closeOnClick 时切换后关闭菜单", async () => {
    const onOpenChange = vi.fn();
    renderOpenMenu(
      () => (
        <DropdownMenuCheckboxItem closeOnClick>
          显示工具栏
        </DropdownMenuCheckboxItem>
      ),
      { onOpenChange },
    );
    await waitForMount();

    fireEvent.click(item());

    expect(onOpenChange).toHaveBeenCalledWith(
      false,
      expect.objectContaining({ reason: "item-press" }),
    );
    expect(slot("dropdown-menu-content")).toBeNull();
  });
});

describe("DropdownMenuCheckboxItem - 字符导航", () => {
  it("label 属性参与匹配并高亮对应项", async () => {
    renderOpenMenu(() => (
      <>
        <DropdownMenuCheckboxItem label="网格线">
          第一个
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem>第二个</DropdownMenuCheckboxItem>
      </>
    ));
    await waitForMount();

    fireEvent.keyDown(slot("dropdown-menu-content")!, { key: "网" });

    const items = slots("dropdown-menu-checkbox-item");
    expect(items[0]).toHaveAttribute("data-highlighted", "");
    expect(items[1]).not.toHaveAttribute("data-highlighted");
  });
});
