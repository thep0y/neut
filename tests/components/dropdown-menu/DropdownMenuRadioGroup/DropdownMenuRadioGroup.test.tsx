import { fireEvent } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DropdownMenuLabel } from "~/components/dropdown-menu/DropdownMenuLabel/DropdownMenuLabel";
import { DropdownMenuRadioGroup } from "~/components/dropdown-menu/DropdownMenuRadioGroup/DropdownMenuRadioGroup";
import { DropdownMenuRadioItem } from "~/components/dropdown-menu/DropdownMenuRadioItem/DropdownMenuRadioItem";
import { renderOpenMenu, slot, slots, waitForMount } from "../test-utils";

function radioItems(): HTMLElement[] {
  return slots("dropdown-menu-radio-item");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DropdownMenuRadioGroup - 结构与关联", () => {
  it("渲染 role=group 并透传 class", () => {
    renderOpenMenu(() => (
      <DropdownMenuRadioGroup class="my-group">
        <DropdownMenuRadioItem value="a">甲</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    ));

    const group = slot("dropdown-menu-radio-group")!;
    expect(group).toHaveAttribute("role", "group");
    expect(group).toHaveAttribute("data-slot", "dropdown-menu-radio-group");
    expect(group.className).toContain("my-group");
  });

  it("组内 Label 的 id 写到 aria-labelledby", () => {
    renderOpenMenu(() => (
      <DropdownMenuRadioGroup>
        <DropdownMenuLabel>外观</DropdownMenuLabel>
        <DropdownMenuRadioItem value="a">浅色</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    ));

    expect(slot("dropdown-menu-radio-group")).toHaveAttribute(
      "aria-labelledby",
      slot("dropdown-menu-label")!.id,
    );
  });
});

describe("DropdownMenuRadioGroup - 非受控与受控", () => {
  it("defaultValue 决定初始选中项", () => {
    renderOpenMenu(() => (
      <DropdownMenuRadioGroup defaultValue="b">
        <DropdownMenuRadioItem value="a">浅色</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="b">深色</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    ));

    expect(radioItems()[0]).toHaveAttribute("aria-checked", "false");
    expect(radioItems()[1]).toHaveAttribute("aria-checked", "true");
  });

  it("非受控下点击另一项写内部状态并回调", async () => {
    const onValueChange = vi.fn();
    renderOpenMenu(() => (
      <DropdownMenuRadioGroup defaultValue="a" onValueChange={onValueChange}>
        <DropdownMenuRadioItem value="a">浅色</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="b">深色</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    ));
    await waitForMount();

    fireEvent.click(radioItems()[1]!);

    expect(radioItems()[0]).toHaveAttribute("aria-checked", "false");
    expect(radioItems()[1]).toHaveAttribute("aria-checked", "true");
    expect(onValueChange).toHaveBeenCalledWith(
      "b",
      expect.objectContaining({ reason: "item-press" }),
    );
  });

  it("受控下点击只回调，选中状态由外部 value 决定", async () => {
    const onValueChange = vi.fn();
    renderOpenMenu(() => (
      <DropdownMenuRadioGroup value="a" onValueChange={onValueChange}>
        <DropdownMenuRadioItem value="a">浅色</DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="b">深色</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    ));
    await waitForMount();

    fireEvent.click(radioItems()[1]!);

    expect(onValueChange).toHaveBeenCalledWith("b", expect.anything());
    expect(radioItems()[0]).toHaveAttribute("aria-checked", "true");
    expect(radioItems()[1]).toHaveAttribute("aria-checked", "false");
  });
});

describe("DropdownMenuRadioGroup - disabled", () => {
  it("组 disabled 时所有项都标记禁用且点击无效", async () => {
    const onValueChange = vi.fn();
    renderOpenMenu(() => (
      <DropdownMenuRadioGroup disabled onValueChange={onValueChange}>
        <DropdownMenuRadioItem value="a">浅色</DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    ));
    await waitForMount();

    const item = radioItems()[0]!;
    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(item).toHaveAttribute("data-disabled", "");

    fireEvent.click(item);

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
