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
 * 与 `ComboboxInput` 的差异：它**只有** `onInput` / `onFocus`（无键盘导航），
 * 且 disabled 完全由根组件的 `disabled` 决定。
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
