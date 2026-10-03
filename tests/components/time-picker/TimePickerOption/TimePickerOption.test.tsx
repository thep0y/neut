import { fireEvent, render, screen } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { TimePickerOption } from "~/components/time-picker/TimePickerOption/TimePickerOption";
import type { TimePickerOptionProps } from "~/components/time-picker/TimePickerOption/TimePickerOption.types";

/**
 * `TimePickerOption` 是 `role="option"` 的纯展示项：状态全部走 ARIA 与 data-*，
 * 交互只是把原生 click 事件交给调用方的 `onSelect`。
 */

function renderOption(props: TimePickerOptionProps) {
  return render(() => <TimePickerOption {...props} />);
}

describe("TimePickerOption - 渲染与 ARIA", () => {
  it("渲染为 role=option，value 写到 data-value，且不可聚焦", () => {
    renderOption({ value: 5 });

    const option = screen.getByRole("option");

    expect(option).toHaveAttribute("data-value", "5");
    expect(option).toHaveAttribute("tabindex", "-1");
    expect(option).toHaveTextContent("5");
  });

  it("未选中时不写 aria-selected，也没有 data-selected / data-highlighted", () => {
    renderOption({ value: 5 });

    const option = screen.getByRole("option");

    // Solid 对 `false` 会移除属性，因此未选中 = 没有 aria-selected（ARIA 默认即 false）
    expect(option).not.toHaveAttribute("aria-selected");
    expect(option).not.toHaveAttribute("data-selected");
    expect(option).not.toHaveAttribute("data-highlighted");
  });

  it("选中时 aria-selected=true 并同时点亮 data-selected / data-highlighted", () => {
    renderOption({ value: 5, selected: true });

    const option = screen.getByRole("option");

    expect(option).toHaveAttribute("aria-selected", "true");
    expect(option).toHaveAttribute("data-selected", "true");
    expect(option).toHaveAttribute("data-highlighted", "true");
  });

  it("disabled 时 aria-disabled=true 且 data-disabled 为空串", () => {
    renderOption({ value: "AM", disabled: true });

    const option = screen.getByRole("option");

    expect(option).toHaveAttribute("aria-disabled", "true");
    expect(option).toHaveAttribute("data-disabled", "");
  });

  it("未 disabled 时不写 aria-disabled，也没有 data-disabled", () => {
    renderOption({ value: "AM" });

    const option = screen.getByRole("option");

    expect(option).not.toHaveAttribute("aria-disabled");
    expect(option).not.toHaveAttribute("data-disabled");
  });
});

describe("TimePickerOption - 内容与透传", () => {
  it("没有 children 时回退显示 value 的字符串形式", () => {
    renderOption({ value: "PM" });

    expect(screen.getByRole("option")).toHaveTextContent("PM");
  });

  it("提供 children 时优先渲染 children", () => {
    renderOption({ value: 5, children: <span>05 分</span> });

    expect(screen.getByRole("option")).toHaveTextContent("05 分");
    expect(screen.queryByText("5")).toBeNull();
  });

  it("id 与 class 透传到元素", () => {
    renderOption({ value: 1, id: "hour-1", class: "custom-option" });

    const option = screen.getByRole("option");

    expect(option).toHaveAttribute("id", "hour-1");
    expect(option).toHaveClass("custom-option");
  });

  it("BaseProps 上的 dir 透传到元素", () => {
    renderOption({ value: 1, dir: "rtl" });

    expect(screen.getByRole("option")).toHaveAttribute("dir", "rtl");
  });
});

describe("TimePickerOption - 点击", () => {
  it("点击时把原生事件交给 onSelect", () => {
    const onSelect = vi.fn();
    renderOption({ value: 3, onSelect });

    fireEvent.click(screen.getByRole("option"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect((onSelect.mock.calls[0]![0] as MouseEvent).type).toBe("click");
  });

  it("没传 onSelect 时点击不阻断事件传播", () => {
    const onParentClick = vi.fn();
    render(() => (
      <div onClick={onParentClick}>
        <TimePickerOption value={3} />
      </div>
    ));

    fireEvent.click(screen.getByRole("option"));

    expect(onParentClick).toHaveBeenCalledTimes(1);
  });
});
