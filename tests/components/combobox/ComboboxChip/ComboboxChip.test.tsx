import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ComboboxChip } from "~/components/combobox/ComboboxChip/ComboboxChip";
import { ComboboxChips } from "~/components/combobox/ComboboxChips/ComboboxChips";
import { bySlot, allBySlot, renderCombobox } from "../test-utils";

/**
 * `ComboboxChip`：多选值的一颗 chip，默认带删除按钮（`showRemove !== false`）。
 */
function renderChip(
  options: Parameters<typeof renderCombobox>[0] = {},
  chipProps: Record<string, unknown> = {},
) {
  return renderCombobox(
    {
      multiple: true,
      defaultValue: ["apple", "banana"],
      open: true,
      ...options,
    },
    () => (
      <ComboboxChips>
        <ComboboxChip value="apple" {...chipProps}>
          apple
        </ComboboxChip>
      </ComboboxChips>
    ),
  );
}

describe("ComboboxChip", () => {
  it("渲染 chip 容器与内容", () => {
    renderChip();

    const chip = bySlot("combobox-chip");
    expect(chip).not.toBeNull();
    expect(chip).toHaveTextContent("apple");
  });

  it("class 透传到 chip 容器", () => {
    renderChip({}, { class: "my-chip" });

    expect(bySlot("combobox-chip")).toHaveClass("my-chip");
  });

  it("默认渲染删除按钮", () => {
    renderChip();

    expect(bySlot("combobox-chip-remove")).not.toBeNull();
  });

  it("showRemove=false 时不渲染删除按钮", () => {
    renderChip({}, { showRemove: false });

    expect(bySlot("combobox-chip-remove")).toBeNull();
  });

  it("点击删除按钮把该项从多选中移除", async () => {
    const onValueChange = vi.fn();
    renderChip({ onValueChange });
    const user = userEvent.setup();

    await user.click(bySlot("combobox-chip-remove") as HTMLElement);

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(["banana"]);
  });

  it("删除按钮是无障碍按钮且有 data-slot", () => {
    renderChip();

    const button = allBySlot("combobox-chip-remove")[0];
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
  });
});
