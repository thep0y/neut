import { fireEvent } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DropdownMenuRadioGroup } from "~/components/dropdown-menu/DropdownMenuRadioGroup/DropdownMenuRadioGroup";
import { DropdownMenuRadioItem } from "~/components/dropdown-menu/DropdownMenuRadioItem/DropdownMenuRadioItem";
import { renderOpenMenu, slot, slots, waitForMount } from "../test-utils";

function item(): HTMLElement {
  return slot("dropdown-menu-radio-item")!;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DropdownMenuRadioItem - 状态属性", () => {
  it("inset / disabled 写入 data-* 与 aria-disabled", () => {
    renderOpenMenu(() => (
      <DropdownMenuRadioGroup>
        <DropdownMenuRadioItem value="a" inset disabled>
          浅色
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    ));

    expect(item()).toHaveAttribute("data-inset", "");
    expect(item()).toHaveAttribute("data-disabled", "");
    expect(item()).toHaveAttribute("aria-disabled", "true");
  });

  it("选中项带 data-checked 与勾选图标，未选中带 data-unchecked", () => {
    renderOpenMenu(() => (
      <DropdownMenuRadioGroup value="a">
        <DropdownMenuRadioItem value="a">浅色</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="b">深色</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    ));

    const items = slots("dropdown-menu-radio-item");
    expect(items[0]).toHaveAttribute("data-checked", "");
    expect(items[0]).not.toHaveAttribute("data-unchecked");
    expect(items[0]!.querySelector("svg")).not.toBeNull();
    expect(items[1]).toHaveAttribute("data-unchecked", "");
    expect(items[1]!.querySelector("svg")).toBeNull();
  });
});

describe("DropdownMenuRadioItem - 点击行为", () => {
  it("默认不关闭菜单", async () => {
    const onValueChange = vi.fn();
    renderOpenMenu(() => (
      <DropdownMenuRadioGroup onValueChange={onValueChange}>
        <DropdownMenuRadioItem value="a">浅色</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    ));
    await waitForMount();

    fireEvent.click(item());

    expect(onValueChange).toHaveBeenCalledWith(
      "a",
      expect.objectContaining({ reason: "item-press" }),
    );
    expect(slot("dropdown-menu-content")).toBeInTheDocument();
  });

  it("closeOnClick 时选中后关闭菜单", async () => {
    const onOpenChange = vi.fn();
    renderOpenMenu(
      () => (
        <DropdownMenuRadioGroup>
          <DropdownMenuRadioItem value="a" closeOnClick>
            浅色
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
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

  it("disabled 时点击不选中", async () => {
    const onValueChange = vi.fn();
    renderOpenMenu(() => (
      <DropdownMenuRadioGroup onValueChange={onValueChange}>
        <DropdownMenuRadioItem value="a" disabled>
          浅色
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    ));
    await waitForMount();

    fireEvent.click(item());

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("用户 onClick 里 preventDefault 后不选中", async () => {
    const onValueChange = vi.fn();
    renderOpenMenu(() => (
      <DropdownMenuRadioGroup onValueChange={onValueChange}>
        <DropdownMenuRadioItem
          value="a"
          onClick={(event) => event.preventDefault()}
        >
          浅色
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    ));
    await waitForMount();

    fireEvent.click(item());

    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("DropdownMenuRadioItem - 字符导航", () => {
  it("label 属性参与匹配并高亮对应项", async () => {
    renderOpenMenu(() => (
      <DropdownMenuRadioGroup>
        <DropdownMenuRadioItem value="a" label="网格">
          第一个
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="b">第二个</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    ));
    await waitForMount();

    fireEvent.keyDown(slot("dropdown-menu-content")!, { key: "网" });

    const items = slots("dropdown-menu-radio-item");
    expect(items[0]).toHaveAttribute("data-highlighted", "");
    expect(items[1]).not.toHaveAttribute("data-highlighted");
  });
});
