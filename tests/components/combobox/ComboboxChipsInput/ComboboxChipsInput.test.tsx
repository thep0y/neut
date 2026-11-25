import { fireEvent } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import type { JSX } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { ComboboxChips } from "~/components/combobox/ComboboxChips/ComboboxChips";
import { ComboboxChipsInput } from "~/components/combobox/ComboboxChipsInput/ComboboxChipsInput";
import { ComboboxContent } from "~/components/combobox/ComboboxContent/ComboboxContent";
import { ComboboxItem } from "~/components/combobox/ComboboxItem/ComboboxItem";
import { ComboboxList } from "~/components/combobox/ComboboxList/ComboboxList";
import {
  bySlot,
  comboboxInput,
  comboboxOptions,
  renderCombobox,
} from "../test-utils";

/**
 * `ComboboxChipsInput`：chips 模式下的搜索输入框。
 *
 * 与 `ComboboxInput` 共用 combobox ARIA 与键盘导航；额外承担
 * “输入为空时 Backspace 删除最后一颗 chip”的约定。
 */
function renderChipsInput(
  options: Parameters<typeof renderCombobox>[0] = {},
  inputProps: { placeholder?: string; class?: string } = {},
): ReturnType<typeof renderCombobox> {
  return renderCombobox(
    { open: true, ...options },
    (): JSX.Element => (
      <ComboboxChips>
        <ComboboxChipsInput placeholder="搜索" {...inputProps} />
        <ComboboxContent>
          <ComboboxList>
            {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
          </ComboboxList>
        </ComboboxContent>
      </ComboboxChips>
    ),
  );
}

describe("ComboboxChipsInput", () => {
  it("渲染为 data-slot=combobox-chip-input 的输入框", () => {
    renderChipsInput();

    const input = bySlot("combobox-chip-input");
    expect(input?.tagName).toBe("INPUT");
    expect(input).toHaveAttribute("placeholder", "搜索");
  });

  it("class 透传到输入框", () => {
    renderChipsInput({}, { class: "my-chip-input" });

    expect(bySlot("combobox-chip-input")).toHaveClass("my-chip-input");
  });

  it("输入后过滤选项", async () => {
    renderChipsInput();
    const user = userEvent.setup();

    await user.type(comboboxInput(), "ban");

    expect(comboboxOptions().map((o) => o.textContent)).toEqual(["banana"]);
  });

  it("输入框展示已输入的值", async () => {
    renderChipsInput();
    const user = userEvent.setup();

    await user.type(comboboxInput(), "ap");

    expect(comboboxInput().value).toBe("ap");
  });

  it("输入时请求打开面板", async () => {
    const onOpenChange = vi.fn();
    renderChipsInput({ open: false, onOpenChange });
    const user = userEvent.setup();

    await user.type(comboboxInput(), "a");

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("聚焦时请求打开面板", () => {
    const onOpenChange = vi.fn();
    renderChipsInput({ open: false, onOpenChange });

    fireEvent.focus(comboboxInput());

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("根组件 disabled 时输入框禁用", () => {
    renderChipsInput({ disabled: true });

    expect(comboboxInput()).toBeDisabled();
  });
});

describe("ComboboxChipsInput - combobox 语义与键盘", () => {
  it("输入框是 combobox，并关联 listbox 与 active option", () => {
    renderChipsInput();
    const input = comboboxInput();

    expect(input).toHaveAttribute("role", "combobox");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-controls", bySlot("combobox-list")!.id);

    fireEvent.keyDown(input, { key: "ArrowDown" });

    expect(input).toHaveAttribute(
      "aria-activedescendant",
      comboboxOptions()[0].id,
    );
  });

  it("关闭时不输出 aria-controls", () => {
    renderChipsInput({ open: false });
    const input = comboboxInput();

    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(input).not.toHaveAttribute("aria-controls");
  });

  it("disabled 时键盘不导航", () => {
    renderChipsInput({ disabled: true });
    const input = comboboxInput();

    fireEvent.keyDown(input, { key: "ArrowDown" });

    expect(input).not.toHaveAttribute("aria-activedescendant");
  });

  it("ArrowDown + Enter 在 chips 模式下选中项", () => {
    const onValueChange = vi.fn();
    renderChipsInput({
      multiple: true,
      defaultValue: [],
      onValueChange,
    });
    const input = comboboxInput();

    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onValueChange).toHaveBeenCalledWith(["apple"], expect.anything());
  });

  it("Home / End 跳到首尾项，Escape 关闭面板", () => {
    const onOpenChange = vi.fn();
    renderChipsInput({ onOpenChange });
    const input = comboboxInput();

    fireEvent.keyDown(input, { key: "End" });
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      comboboxOptions()[2].id,
    );

    fireEvent.keyDown(input, { key: "Home" });
    expect(input).toHaveAttribute(
      "aria-activedescendant",
      comboboxOptions()[0].id,
    );

    fireEvent.keyDown(input, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
  });

  it("输入过滤后 ArrowDown/Enter 选中过滤结果", () => {
    const onValueChange = vi.fn();
    renderChipsInput({
      multiple: true,
      defaultValue: [],
      onValueChange,
    });
    const input = comboboxInput();

    fireEvent.input(input, { target: { value: "cher" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onValueChange).toHaveBeenCalledWith(["cherry"], expect.anything());
  });
});

describe("ComboboxChipsInput - Backspace 删除 chip（回归）", () => {
  it("输入框为空时按 Backspace 删除最后一颗 chip", () => {
    const onValueChange = vi.fn();
    renderChipsInput({
      multiple: true,
      defaultValue: ["apple", "banana"],
      onValueChange,
    });
    const target = bySlot("combobox-chip-input") as HTMLInputElement;

    fireEvent.keyDown(target, { key: "Backspace" });

    expect(onValueChange).toHaveBeenCalledWith(["apple"], expect.anything());
  });

  it("输入框有内容时不删 chip（让浏览器正常删字符）", () => {
    const onValueChange = vi.fn();
    renderChipsInput({
      multiple: true,
      defaultValue: ["apple", "banana"],
      onValueChange,
    });
    const target = bySlot("combobox-chip-input") as HTMLInputElement;
    fireEvent.input(target, { target: { value: "ap" } });

    const notCanceled = fireEvent.keyDown(target, { key: "Backspace" });

    expect(onValueChange).not.toHaveBeenCalled();
    expect(notCanceled).toBe(true);
  });

  it("没有可删的 chip 时不阻止默认行为", () => {
    const onValueChange = vi.fn();
    renderChipsInput({ multiple: true, defaultValue: [], onValueChange });
    const target = bySlot("combobox-chip-input") as HTMLInputElement;

    const notCanceled = fireEvent.keyDown(target, { key: "Backspace" });

    expect(onValueChange).not.toHaveBeenCalled();
    expect(notCanceled).toBe(true);
  });

  it("单值（非数组）时 Backspace 不删值", () => {
    const onValueChange = vi.fn();
    renderChipsInput({ defaultValue: "apple", onValueChange });
    const target = bySlot("combobox-chip-input") as HTMLInputElement;

    fireEvent.keyDown(target, { key: "Backspace" });

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("Backspace 之外的按键不受影响", () => {
    const onValueChange = vi.fn();
    renderChipsInput({
      multiple: true,
      defaultValue: ["apple", "banana"],
      onValueChange,
    });
    const target = bySlot("combobox-chip-input") as HTMLInputElement;

    fireEvent.keyDown(target, { key: "a" });

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
