import { fireEvent } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ComboboxItem } from "~/components/combobox/ComboboxItem/ComboboxItem";
import { comboboxOptions, renderCombobox } from "../test-utils";

/**
 * `ComboboxItem`：`role=option` 的行。
 *
 * 高亮有两个来源：键盘/悬停驱动的 `activeIndex`（`active`），以及指针进入的
 * `hovered`。`data-highlighted` 是二者之或，下游 `data-highlighted:` 样式依赖它。
 */
function renderItem(
  options: Parameters<typeof renderCombobox>[0] = {},
  itemProps: Record<string, unknown> = {},
) {
  return renderCombobox({ open: true, ...options }, () => (
    <ComboboxItem value="apple" {...itemProps}>
      apple
    </ComboboxItem>
  ));
}

describe("ComboboxItem - 渲染与选中", () => {
  it("渲染为 role=option 且可聚焦（tabIndex=0）", () => {
    renderItem();

    const option = comboboxOptions()[0];
    expect(option).toHaveAttribute("data-slot", "combobox-item");
    expect(option).toHaveAttribute("aria-selected", "false");
    expect(option).toHaveAttribute("tabindex", "0");
  });

  it("选中项 aria-selected=true 并渲染选中标记", () => {
    renderItem({ defaultValue: "apple" });

    const option = comboboxOptions()[0];
    expect(option).toHaveAttribute("aria-selected", "true");
    expect(option.querySelector("svg")).not.toBeNull();
  });

  it("未选中项没有选中标记", () => {
    renderItem({ defaultValue: "banana", items: ["apple", "banana"] });

    expect(comboboxOptions()[0].querySelector("svg")).toBeNull();
  });

  it("class 透传到行", () => {
    renderItem({}, { class: "my-item" });

    expect(comboboxOptions()[0]).toHaveClass("my-item");
  });
});

describe("ComboboxItem - 点击选中", () => {
  it("点击未禁用项回调 onValueChange", async () => {
    const onValueChange = vi.fn();
    renderItem({ items: ["apple"], onValueChange });
    const user = userEvent.setup();

    await user.click(comboboxOptions()[0]);

    expect(onValueChange).toHaveBeenCalledWith("apple", expect.anything());
  });

  it("禁用项 tabIndex=-1 且点击不回调", async () => {
    const onValueChange = vi.fn();
    renderItem({ items: ["apple"], onValueChange }, { disabled: true });
    const user = userEvent.setup();

    expect(comboboxOptions()[0]).toHaveAttribute("tabindex", "-1");

    await user.click(comboboxOptions()[0]);

    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("ComboboxItem - 高亮状态", () => {
  it("悬停时进入高亮，移开后仍因 activeIndex 保持高亮", () => {
    renderItem({ items: ["apple", "banana"] });
    const apple = comboboxOptions()[0];

    fireEvent.mouseEnter(apple);
    expect(apple).toHaveAttribute("data-highlighted", "");

    // mouseleave 只清 hovered；activeIndex 已被 hover 写成 0，因此仍高亮
    fireEvent.mouseLeave(apple);
    expect(apple).toHaveAttribute("data-highlighted", "");
  });

  it("悬停另一项时高亮转移", async () => {
    renderCombobox({ open: true, items: ["apple", "banana"] }, () => (
      <>
        <ComboboxItem value="apple">apple</ComboboxItem>
        <ComboboxItem value="banana">banana</ComboboxItem>
      </>
    ));
    const user = userEvent.setup();
    const [apple, banana] = comboboxOptions();

    await user.hover(apple);
    await user.hover(banana);

    expect(apple).not.toHaveAttribute("data-highlighted");
    expect(banana).toHaveAttribute("data-highlighted", "");
  });

  it("悬停不在 filteredItems 里的项只靠 hovered 高亮，移开即取消", () => {
    renderItem({ items: ["apple", "banana"] }, { value: "ghost" });
    const ghost = comboboxOptions()[0];

    fireEvent.mouseEnter(ghost);

    // indexOf 返回 -1，activeIndex 未被改写；ghost 只因 hovered 高亮
    expect(ghost).toHaveAttribute("data-highlighted", "");

    fireEvent.mouseLeave(ghost);
    expect(ghost).not.toHaveAttribute("data-highlighted");
  });

  it("悬停不在 filteredItems 里的项不会改变其它项的 activeIndex", () => {
    renderCombobox({ open: true, items: ["apple"] }, () => (
      <>
        <ComboboxItem value="apple">apple</ComboboxItem>
        <ComboboxItem value="ghost">ghost</ComboboxItem>
      </>
    ));
    const [apple, ghost] = comboboxOptions();

    fireEvent.mouseEnter(ghost);

    expect(apple).not.toHaveAttribute("data-highlighted");
  });
});
