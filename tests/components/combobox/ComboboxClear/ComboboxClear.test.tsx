import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ComboboxClear } from "~/components/combobox/ComboboxClear/ComboboxClear";
import { ComboboxInput } from "~/components/combobox/ComboboxInput/ComboboxInput";
import { bySlot, comboboxInput, renderCombobox } from "../test-utils";

/**
 * `ComboboxClear`：清空按钮。一次点击要同时清空值、输入框、过滤词并关闭面板。
 */
function renderClear(
  options: Parameters<typeof renderCombobox>[0] = {},
  clearProps: { disabled?: boolean; class?: string } = {},
) {
  return renderCombobox(
    { open: true, defaultValue: "apple", ...options },
    () => (
      <>
        <ComboboxInput />
        <ComboboxClear {...clearProps} />
      </>
    ),
  );
}

describe("ComboboxClear", () => {
  it("渲染为带 aria-label 的清除按钮", () => {
    renderClear();

    const clear = bySlot("combobox-clear");
    expect(clear?.tagName).toBe("BUTTON");
    expect(clear).toHaveAttribute("aria-label", "Clear");
  });

  it("点击后清空值、输入框与过滤词并关闭面板", async () => {
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    renderCombobox(
      {
        open: true,
        defaultValue: "apple",
        onValueChange,
        onOpenChange,
      },
      () => (
        <>
          <ComboboxInput />
          <ComboboxClear />
        </>
      ),
    );
    const user = userEvent.setup();
    expect(comboboxInput().value).toBe("apple");

    await user.click(bySlot("combobox-clear") as HTMLElement);

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(null, expect.anything());
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything());
    expect(comboboxInput().value).toBe("");
  });

  it("class 透传到按钮", () => {
    renderClear({}, { class: "my-clear" });

    expect(bySlot("combobox-clear")).toHaveClass("my-clear");
  });

  it("根组件 disabled 时按钮禁用", () => {
    renderClear({ disabled: true });

    expect(bySlot("combobox-clear")).toBeDisabled();
  });

  it("自身 disabled 时按钮禁用", () => {
    renderClear({}, { disabled: true });

    expect(bySlot("combobox-clear")).toBeDisabled();
  });

  it("disabled 时点击不清空值", async () => {
    const onValueChange = vi.fn();
    renderClear({ onValueChange }, { disabled: true });
    const user = userEvent.setup();

    await user.click(bySlot("combobox-clear") as HTMLElement);

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
