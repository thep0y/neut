import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ComboboxContent } from "~/components/combobox/ComboboxContent/ComboboxContent";
import { ComboboxItem } from "~/components/combobox/ComboboxItem/ComboboxItem";
import { ComboboxList } from "~/components/combobox/ComboboxList/ComboboxList";
import { ComboboxTrigger } from "~/components/combobox/ComboboxTrigger/ComboboxTrigger";
import { bySlot, renderCombobox } from "../test-utils";

/**
 * `ComboboxTrigger`：弹层（Popup）模式的按钮触发器。
 *
 * 它同时承担"把自身登记为浮层锚点"的职责。
 */
function renderTrigger(
  options: Parameters<typeof renderCombobox>[0] = {},
  triggerProps: { disabled?: boolean; class?: string } = {},
) {
  return renderCombobox({ ...options }, () => (
    <>
      <ComboboxTrigger {...triggerProps}>选择水果</ComboboxTrigger>
      <ComboboxContent>
        <ComboboxList>
          {(item: string) => <ComboboxItem value={item}>{item}</ComboboxItem>}
        </ComboboxList>
      </ComboboxContent>
    </>
  ));
}

describe("ComboboxTrigger", () => {
  it("渲染为 data-slot=combobox-trigger 的按钮并展示 children", () => {
    renderTrigger();

    const trigger = bySlot("combobox-trigger");
    expect(trigger?.tagName).toBe("BUTTON");
    expect(trigger).toHaveTextContent("选择水果");
  });

  it("渲染下拉图标", () => {
    renderTrigger();

    expect(bySlot("combobox-trigger-icon")).not.toBeNull();
  });

  it("关闭状态下点击请求打开", async () => {
    const onOpenChange = vi.fn();
    renderTrigger({ open: false, onOpenChange });
    const user = userEvent.setup();

    await user.click(bySlot("combobox-trigger") as HTMLElement);

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it("打开状态下点击请求关闭", async () => {
    const onOpenChange = vi.fn();
    renderTrigger({ open: true, onOpenChange });
    const user = userEvent.setup();

    await user.click(bySlot("combobox-trigger") as HTMLElement);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("非受控下点击真正打开面板", async () => {
    renderTrigger({ defaultOpen: false });
    const user = userEvent.setup();
    expect(bySlot("combobox-content")).toBeNull();

    await user.click(bySlot("combobox-trigger") as HTMLElement);

    expect(bySlot("combobox-content")).not.toBeNull();
  });

  it("根组件 disabled 时按钮禁用", () => {
    renderTrigger({ disabled: true });

    expect(bySlot("combobox-trigger")).toBeDisabled();
  });

  it("自身 disabled 时按钮禁用", () => {
    renderTrigger({}, { disabled: true });

    expect(bySlot("combobox-trigger")).toBeDisabled();
  });

  it("class 透传到按钮", () => {
    renderTrigger({}, { class: "my-trigger" });

    expect(bySlot("combobox-trigger")).toHaveClass("my-trigger");
  });
});
