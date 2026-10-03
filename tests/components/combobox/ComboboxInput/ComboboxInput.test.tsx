import { fireEvent } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ComboboxContent } from "~/components/combobox/ComboboxContent/ComboboxContent";
import { ComboboxInput } from "~/components/combobox/ComboboxInput/ComboboxInput";
import { ComboboxItem } from "~/components/combobox/ComboboxItem/ComboboxItem";
import { ComboboxList } from "~/components/combobox/ComboboxList/ComboboxList";
import { ComboboxTrigger } from "~/components/combobox/ComboboxTrigger/ComboboxTrigger";
import {
  bySlot,
  comboboxInput,
  comboboxOptions,
  renderCombobox,
} from "../test-utils";

/**
 * `ComboboxInput`：`InputGroup` + 原生 input 的搜索框。
 *
 * 键盘分支（方向键环绕 / Enter 选中 active / Escape 关闭）、`showClear` 的
 * 显隐条件（`hasValue` 的空值判定）、"作为 Popup 子组件时自动聚焦"都在这里覆盖。
 */
function renderInput(
  options: Parameters<typeof renderCombobox>[0] = {},
  inputProps: Record<string, unknown> = {},
) {
  return renderCombobox({ open: true, ...options }, () => (
    <>
      <ComboboxInput placeholder="搜索" {...inputProps} />
      <ComboboxContent>
        <ComboboxList>
          {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </>
  ));
}

describe("ComboboxInput - 渲染", () => {
  it("渲染 data-slot=input-group-control 的原生输入框", () => {
    renderInput();

    const input = bySlot("input-group-control");
    expect(input?.tagName).toBe("INPUT");
    expect(input).toHaveAttribute("placeholder", "搜索");
  });

  it("class 透传到 InputGroup 容器", () => {
    renderInput({}, { class: "my-input" });

    expect(bySlot("input-group")).toHaveClass("my-input");
  });

  it("aria-invalid 透传到输入框", () => {
    renderInput({}, { "aria-invalid": true });

    expect(comboboxInput()).toHaveAttribute("aria-invalid", "true");
  });

  it("children 渲染在输入组末尾", () => {
    renderInput({}, { children: <span data-slot="trailing">尾槽</span> });

    expect(bySlot("trailing")).toHaveTextContent("尾槽");
  });

  it("根组件 disabled 时输入框禁用", () => {
    renderInput({ disabled: true });

    expect(comboboxInput()).toBeDisabled();
  });

  it("自身 disabled 时输入框禁用", () => {
    renderInput({}, { disabled: true });

    expect(comboboxInput()).toBeDisabled();
  });
});

describe("ComboboxInput - 清空按钮显隐", () => {
  it("showClear 默认 false 时不渲染清空按钮", () => {
    renderInput({ defaultValue: "apple" });

    expect(bySlot("combobox-clear")).toBeNull();
  });

  it("showClear 且有字符串值时渲染清空按钮", () => {
    renderInput({ defaultValue: "apple" }, { showClear: true });

    expect(bySlot("combobox-clear")).not.toBeNull();
  });

  it("showClear 但值为 null 时不渲染", () => {
    renderInput({ value: null }, { showClear: true });

    expect(bySlot("combobox-clear")).toBeNull();
  });

  it("showClear 但值为空字符串时不渲染", () => {
    renderInput({ value: "" }, { showClear: true });

    expect(bySlot("combobox-clear")).toBeNull();
  });

  it("showClear 且多选值为空数组时不渲染", () => {
    renderInput({ multiple: true, defaultValue: [] }, { showClear: true });

    expect(bySlot("combobox-clear")).toBeNull();
  });

  it("showClear 且多选值非空时渲染", () => {
    renderInput(
      { multiple: true, defaultValue: ["apple"] },
      { showClear: true },
    );

    expect(bySlot("combobox-clear")).not.toBeNull();
  });

  it("showClear 但 disabled 时不渲染", () => {
    renderInput({ disabled: true, defaultValue: "apple" }, { showClear: true });

    expect(bySlot("combobox-clear")).toBeNull();
  });
});

describe("ComboboxInput - 输入与开关", () => {
  it("输入后过滤选项", async () => {
    renderInput();
    const user = userEvent.setup();

    await user.type(comboboxInput(), "ban");

    expect(comboboxOptions().map((o) => o.textContent)).toEqual(["banana"]);
  });

  it("输入时请求打开面板", async () => {
    const onOpenChange = vi.fn();
    renderInput({ open: false, onOpenChange });
    const user = userEvent.setup();

    await user.type(comboboxInput(), "a");

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("聚焦时请求打开面板", () => {
    const onOpenChange = vi.fn();
    renderInput({ open: false, onOpenChange });

    fireEvent.focus(comboboxInput());

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("点击时请求打开面板", () => {
    const onOpenChange = vi.fn();
    renderInput({ open: false, onOpenChange });

    fireEvent.click(comboboxInput());

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("非多选下清空输入会同时清掉已选值", async () => {
    const onValueChange = vi.fn();
    renderInput({ defaultValue: "apple", onValueChange });
    const user = userEvent.setup();

    await user.clear(comboboxInput());

    expect(onValueChange).toHaveBeenCalledWith(null);
    expect(comboboxInput().value).toBe("");
  });

  it("非多选下输入非空字符不会清掉已选值", async () => {
    const onValueChange = vi.fn();
    renderInput({ defaultValue: "apple", onValueChange });
    const user = userEvent.setup();

    await user.type(comboboxInput(), "b");

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("多选下清空输入不改动已选值", async () => {
    const onValueChange = vi.fn();
    renderInput({ multiple: true, defaultValue: ["apple"], onValueChange });
    const user = userEvent.setup();

    await user.type(comboboxInput(), "a");
    await user.clear(comboboxInput());

    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("ComboboxInput - 键盘", () => {
  it("ArrowDown 在关闭状态下请求打开并阻止默认行为", () => {
    const onOpenChange = vi.fn();
    renderInput({ open: false, onOpenChange });

    const notCanceled = fireEvent.keyDown(comboboxInput(), {
      key: "ArrowDown",
    });

    expect(notCanceled).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("ArrowDown 在打开状态下高亮第一项", () => {
    renderInput({ open: true });

    fireEvent.keyDown(comboboxInput(), { key: "ArrowDown" });

    expect(comboboxOptions()[0]).toHaveAttribute("data-highlighted", "");
  });

  it("[当前行为] ArrowUp 从无高亮出发落在索引 1（(-1-1+n)%n），并阻止默认行为", () => {
    const onOpenChange = vi.fn();
    renderInput({
      open: true,
      items: ["apple", "banana", "cherry"],
      onOpenChange,
    });

    const notCanceled = fireEvent.keyDown(comboboxInput(), { key: "ArrowUp" });

    expect(notCanceled).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    // 当前算法对 activeIndex=-1 先减 1 再加 n，3 项时得到 1 而不是末项 2
    expect(comboboxOptions()[1]).toHaveAttribute("data-highlighted", "");
    expect(comboboxOptions()[2]).not.toHaveAttribute("data-highlighted");
  });

  it("选项为空时 ArrowDown 把 activeIndex 置为 -1", () => {
    renderInput({ items: [] });

    fireEvent.keyDown(comboboxInput(), { key: "ArrowDown" });

    expect(comboboxOptions()).toHaveLength(0);
    expect(document.querySelector("[data-highlighted]")).toBeNull();
  });

  it("选项为空时 ArrowUp 把 activeIndex 置为 -1", () => {
    renderInput({ items: [] });

    fireEvent.keyDown(comboboxInput(), { key: "ArrowUp" });

    expect(comboboxOptions()).toHaveLength(0);
    expect(document.querySelector("[data-highlighted]")).toBeNull();
  });

  it("Enter 在打开时选中当前高亮项", () => {
    const onValueChange = vi.fn();
    renderInput({ open: true, onValueChange });

    fireEvent.keyDown(comboboxInput(), { key: "ArrowDown" });
    fireEvent.keyDown(comboboxInput(), { key: "Enter" });

    expect(onValueChange).toHaveBeenCalledWith("apple");
  });

  it("Enter 在高亮为空时不选中任何项", () => {
    const onValueChange = vi.fn();
    renderInput({ items: [], onValueChange });

    fireEvent.keyDown(comboboxInput(), { key: "Enter" });

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("Enter 在关闭状态下不选中", () => {
    const onValueChange = vi.fn();
    renderInput({ open: false, onValueChange });

    fireEvent.keyDown(comboboxInput(), { key: "Enter" });

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("Escape 在打开时关闭面板", () => {
    const onOpenChange = vi.fn();
    renderInput({ onOpenChange });

    const notCanceled = fireEvent.keyDown(comboboxInput(), { key: "Escape" });

    expect(notCanceled).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("Escape 在关闭状态下不回调", () => {
    const onOpenChange = vi.fn();
    renderInput({ open: false, onOpenChange });

    fireEvent.keyDown(comboboxInput(), { key: "Escape" });

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("disabled 时方向键不打开面板", () => {
    const onOpenChange = vi.fn();
    renderInput({ open: false, disabled: true, onOpenChange });

    fireEvent.keyDown(comboboxInput(), { key: "ArrowDown" });

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

describe("ComboboxInput - Popup 模式自动聚焦", () => {
  it("已有外部锚点（Trigger）时打开后自动聚焦输入框", async () => {
    renderCombobox({ open: true, items: ["apple"] }, () => (
      <>
        <ComboboxTrigger>选择</ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput />
          <ComboboxList>
            {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
          </ComboboxList>
        </ComboboxContent>
      </>
    ));
    await Promise.resolve();

    expect(document.activeElement).toBe(comboboxInput());
  });

  it("没有外部锚点时不抢焦点", async () => {
    renderCombobox({ open: true, items: ["apple"] }, () => <ComboboxInput />);
    await Promise.resolve();

    expect(document.activeElement).not.toBe(comboboxInput());
  });
});
