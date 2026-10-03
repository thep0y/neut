import { fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContextMenuLabel } from "~/components/context-menu/ContextMenuLabel/ContextMenuLabel";
import { ContextMenuRadioGroup } from "~/components/context-menu/ContextMenuRadioGroup/ContextMenuRadioGroup";
import { ContextMenuRadioItem } from "~/components/context-menu/ContextMenuRadioItem/ContextMenuRadioItem";
import { renderOpenMenu, slot, slots, waitForMount } from "../test-utils";

function radioItems(): HTMLElement[] {
  return slots("context-menu-radio-item");
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ContextMenuRadioGroup - 渲染与 ARIA", () => {
  it("渲染 role=group 的容器并透传 class", () => {
    renderOpenMenu(() => (
      <ContextMenuRadioGroup class="my-group">
        <ContextMenuRadioItem value="a">甲</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    ));

    const group = slot("context-menu-radio-group")!;
    expect(group).toHaveAttribute("role", "group");
    expect(group).toHaveAttribute("data-slot", "context-menu-radio-group");
    expect(group.className).toContain("my-group");
  });

  it("组内 Label 的 id 写到 aria-labelledby，双向关联成立", () => {
    renderOpenMenu(() => (
      <ContextMenuRadioGroup>
        <ContextMenuLabel>外观</ContextMenuLabel>
        <ContextMenuRadioItem value="a">浅色</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    ));

    const group = slot("context-menu-radio-group")!;
    const label = slot("context-menu-label")!;
    expect(group).toHaveAttribute("aria-labelledby", label.id);
    expect(
      document.getElementById(group.getAttribute("aria-labelledby")!),
    ).toBe(label);
  });
});

describe("ContextMenuRadioGroup - 非受控与受控", () => {
  it("defaultValue 选中对应项", () => {
    renderOpenMenu(() => (
      <ContextMenuRadioGroup defaultValue="b">
        <ContextMenuRadioItem value="a">浅色</ContextMenuRadioItem>
        <ContextMenuRadioItem value="b">深色</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    ));

    const items = radioItems();
    expect(items[0]).toHaveAttribute("aria-checked", "false");
    expect(items[1]).toHaveAttribute("aria-checked", "true");
    expect(items[1]).toHaveAttribute("data-checked", "");
  });

  it("非受控下点击另一项写内部状态并回调", async () => {
    const onValueChange = vi.fn();
    renderOpenMenu(() => (
      <ContextMenuRadioGroup defaultValue="a" onValueChange={onValueChange}>
        <ContextMenuRadioItem value="a">浅色</ContextMenuRadioItem>
        <ContextMenuRadioItem value="b">深色</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    ));
    await waitForMount();

    fireEvent.click(radioItems()[1]!);

    expect(radioItems()[1]).toHaveAttribute("aria-checked", "true");
    expect(onValueChange).toHaveBeenCalledWith(
      "b",
      expect.objectContaining({ reason: "item-press" }),
    );
  });

  it("受控下点击只回调，选中状态由外部 value 决定", async () => {
    const onValueChange = vi.fn();
    renderOpenMenu(() => (
      <ContextMenuRadioGroup value="a" onValueChange={onValueChange}>
        <ContextMenuRadioItem value="a">浅色</ContextMenuRadioItem>
        <ContextMenuRadioItem value="b">深色</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    ));
    await waitForMount();

    fireEvent.click(radioItems()[1]!);

    expect(onValueChange).toHaveBeenCalledWith("b", expect.anything());
    expect(radioItems()[0]).toHaveAttribute("aria-checked", "true");
    expect(radioItems()[1]).toHaveAttribute("aria-checked", "false");
  });

  it("受控值由外部回写后 UI 跟随", async () => {
    const [value, setValue] = createSignal("a");
    renderOpenMenu(() => (
      <ContextMenuRadioGroup value={value()}>
        <ContextMenuRadioItem value="a">浅色</ContextMenuRadioItem>
        <ContextMenuRadioItem value="b">深色</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    ));
    await waitForMount();

    setValue("b");

    expect(radioItems()[0]).toHaveAttribute("aria-checked", "false");
    expect(radioItems()[1]).toHaveAttribute("aria-checked", "true");
  });
});

describe("ContextMenuRadioGroup - disabled", () => {
  it("组 disabled 时所有项都禁用且点击无效", async () => {
    const onValueChange = vi.fn();
    renderOpenMenu(() => (
      <ContextMenuRadioGroup disabled onValueChange={onValueChange}>
        <ContextMenuRadioItem value="a">浅色</ContextMenuRadioItem>
      </ContextMenuRadioGroup>
    ));
    await waitForMount();

    const item = radioItems()[0]!;
    expect(item).toHaveAttribute("aria-disabled", "true");
    expect(item).toHaveAttribute("data-disabled", "");

    fireEvent.click(item);

    expect(onValueChange).not.toHaveBeenCalled();
    expect(item).toHaveAttribute("aria-checked", "false");
  });
});
