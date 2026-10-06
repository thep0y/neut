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

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("聚焦时请求打开面板", () => {
    const onOpenChange = vi.fn();
    renderInput({ open: false, onOpenChange });

    fireEvent.focus(comboboxInput());

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("点击时请求打开面板", () => {
    const onOpenChange = vi.fn();
    renderInput({ open: false, onOpenChange });

    fireEvent.click(comboboxInput());

    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("非多选下清空输入会同时清掉已选值", async () => {
    const onValueChange = vi.fn();
    renderInput({ defaultValue: "apple", onValueChange });
    const user = userEvent.setup();

    await user.clear(comboboxInput());

    expect(onValueChange).toHaveBeenCalledWith(null, expect.anything());
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
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
  });

  it("ArrowDown 在打开状态下高亮第一项", () => {
    renderInput({ open: true });

    fireEvent.keyDown(comboboxInput(), { key: "ArrowDown" });

    expect(comboboxOptions()[0]).toHaveAttribute("data-highlighted", "");
  });

  it("ArrowUp 从无高亮出发落在最后一项，并阻止默认行为（回归）", () => {
    // 此前用 (activeIndex - 1 + n) % n，activeIndex 为 -1 时得到 n-2：
    // 三项时会错误地停在第二项（banana）而不是末项（cherry）
    const onOpenChange = vi.fn();
    renderInput({
      open: true,
      items: ["apple", "banana", "cherry"],
      onOpenChange,
    });

    const notCanceled = fireEvent.keyDown(comboboxInput(), { key: "ArrowUp" });

    expect(notCanceled).toBe(false);
    expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything());
    expect(comboboxOptions()[2]).toHaveAttribute("data-highlighted", "");
    expect(comboboxOptions()[1]).not.toHaveAttribute("data-highlighted");
  });

  it("Home / End 跳到第一项 / 最后一项（回归）", () => {
    renderInput({ open: true, items: ["apple", "banana", "cherry"] });

    fireEvent.keyDown(comboboxInput(), { key: "End" });
    expect(comboboxOptions()[2]).toHaveAttribute("data-highlighted", "");

    fireEvent.keyDown(comboboxInput(), { key: "Home" });
    expect(comboboxOptions()[0]).toHaveAttribute("data-highlighted", "");
  });

  it("两项时 ArrowUp 从无高亮出发落在第 1 项（回归）", () => {
    renderInput({ open: true, items: ["apple", "banana"] });

    fireEvent.keyDown(comboboxInput(), { key: "ArrowUp" });

    expect(comboboxOptions()[1]).toHaveAttribute("data-highlighted", "");
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

    expect(onValueChange).toHaveBeenCalledWith("apple", expect.anything());
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
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
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

describe("ComboboxInput - 空列表与边界（回归新增分支）", () => {
  it("列表为空时 Home / End / 方向键都不高亮任何项", () => {
    renderInput({ open: true, items: [] });
    const target = comboboxInput();

    for (const key of ["Home", "End", "ArrowDown", "ArrowUp"]) {
      fireEvent.keyDown(target, { key });
      expect(target.getAttribute("aria-activedescendant"), key).toBeNull();
    }
  });

  it("在末项上按 ArrowUp 回退一项，而不是环绕", () => {
    renderInput({ open: true, items: ["apple", "banana", "cherry"] });

    fireEvent.keyDown(comboboxInput(), { key: "End" });
    fireEvent.keyDown(comboboxInput(), { key: "ArrowUp" });

    expect(comboboxOptions()[1]).toHaveAttribute("data-highlighted", "");
  });

  it("在首项上按 ArrowUp 环绕到最后一项", () => {
    renderInput({ open: true, items: ["apple", "banana", "cherry"] });

    fireEvent.keyDown(comboboxInput(), { key: "Home" });
    fireEvent.keyDown(comboboxInput(), { key: "ArrowUp" });

    expect(comboboxOptions()[2]).toHaveAttribute("data-highlighted", "");
  });

  it("ArrowDown 在末项上环绕回第一项", () => {
    renderInput({ open: true, items: ["apple", "banana", "cherry"] });

    fireEvent.keyDown(comboboxInput(), { key: "End" });
    fireEvent.keyDown(comboboxInput(), { key: "ArrowDown" });

    expect(comboboxOptions()[0]).toHaveAttribute("data-highlighted", "");
  });

  it("禁用时键盘事件不改变高亮", () => {
    renderInput({ open: true, items: ["apple", "banana"], disabled: true });

    fireEvent.keyDown(comboboxInput(), { key: "ArrowDown" });

    expect(
      comboboxOptions().every(
        (option) => !option.hasAttribute("data-highlighted"),
      ),
    ).toBe(true);
  });
});
