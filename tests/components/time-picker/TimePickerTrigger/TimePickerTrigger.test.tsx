import { fireEvent, render, screen } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { TimePicker } from "~/components/time-picker/TimePicker/TimePicker";
import type { TimePickerProps } from "~/components/time-picker/TimePicker/TimePicker.types";
import { TimePickerTrigger } from "~/components/time-picker/TimePickerTrigger/TimePickerTrigger";
import type { TimePickerTriggerProps } from "~/components/time-picker/TimePickerTrigger/TimePickerTrigger.types";

/**
 * `TimePickerTrigger` 复用 `PopoverTrigger` 的按钮语义与 ARIA，自己只负责
 * 展示文本与 `data-empty` 状态。
 */

function renderTrigger(
  timePickerProps: Partial<TimePickerProps> = {},
  triggerProps: TimePickerTriggerProps = {},
) {
  return render(() => (
    <TimePicker {...timePickerProps}>
      <TimePickerTrigger {...triggerProps} />
    </TimePicker>
  ));
}

function trigger(): HTMLElement {
  return document.querySelector('[data-slot="popover-trigger"]') as HTMLElement;
}

describe("TimePickerTrigger - 展示文本", () => {
  it("无值时显示默认占位并标记 data-empty=true", () => {
    renderTrigger();

    expect(screen.getByRole("button")).toHaveTextContent("Pick a time");
    expect(trigger()).toHaveAttribute("data-empty", "true");
  });

  it("placeholder 覆盖默认占位文案", () => {
    renderTrigger({ placeholder: "选择时间" });

    expect(screen.getByRole("button")).toHaveTextContent("选择时间");
    expect(screen.queryByText("Pick a time")).toBeNull();
  });

  it("有值时按 24 小时制格式化并标记 data-empty=false", () => {
    renderTrigger({ value: new Date(2024, 0, 1, 9, 5) });

    expect(screen.getByRole("button")).toHaveTextContent("09:05");
    expect(trigger()).toHaveAttribute("data-empty", "false");
  });

  it("formatTime 自定义时覆盖默认格式化", () => {
    renderTrigger({
      value: new Date(2024, 0, 1, 9, 5),
      formatTime: (date) => `自定义 ${date.getHours()}`,
    });

    expect(screen.getByRole("button")).toHaveTextContent("自定义 9");
  });

  it("12 小时制显示 AM/PM 文案", () => {
    renderTrigger({
      value: new Date(2024, 0, 1, 15, 5),
      hourCycle: 12,
      locale: "en-US",
    });

    expect(screen.getByRole("button")).toHaveTextContent("3:05 PM");
  });
});

describe("TimePickerTrigger - ARIA 与状态", () => {
  it("复用 PopoverTrigger：aria-haspopup=dialog、关闭时 aria-expanded=false", () => {
    renderTrigger({ defaultValue: new Date(2024, 0, 1, 9, 0) });

    expect(trigger()).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveAttribute("data-state", "closed");
  });

  it("TimePicker disabled 时触发器禁用", () => {
    renderTrigger({ disabled: true });

    expect(trigger()).toBeDisabled();
  });

  it("TimePickerTrigger 自身 disabled 时触发器禁用", () => {
    renderTrigger({}, { disabled: true });

    expect(trigger()).toBeDisabled();
  });
});

describe("TimePickerTrigger - 变体与透传", () => {
  it("默认使用 outline 变体", () => {
    renderTrigger();

    // outline 是 trigger 的默认契约（见 DESIGN.md §6 与 shadcn 用法）
    expect(trigger()).toHaveClass("bg-background");
  });

  it("显式 variant 覆盖默认值", () => {
    renderTrigger({}, { variant: "link" });

    expect(trigger()).toHaveClass("text-primary");
    expect(trigger()).not.toHaveClass("bg-background");
  });

  it("class 与自定义 class 合并", () => {
    renderTrigger({}, { class: "my-trigger" });

    expect(trigger()).toHaveClass("w-40");
    expect(trigger()).toHaveClass("my-trigger");
  });

  it("component 可替换为其它标签并透传 ref", () => {
    let node: HTMLAnchorElement | undefined;
    render(() => (
      <TimePicker>
        <TimePickerTrigger
          component="a"
          ref={(el) => {
            node = el;
          }}
        />
      </TimePicker>
    ));

    expect(trigger().tagName).toBe("A");
    expect(node).toBe(trigger());
  });

  it("调用方自己的 onClick 不被覆盖（点击同时触发开关与用户回调）", async () => {
    const onClick = vi.fn();
    renderTrigger({}, { onClick });

    fireEvent.click(trigger());

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(trigger()).toHaveAttribute("data-state", "open");
  });
});
