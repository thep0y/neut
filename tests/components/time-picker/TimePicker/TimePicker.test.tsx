import { fireEvent, render, screen } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TimePicker } from "~/components/time-picker/TimePicker/TimePicker";
import { TimePickerTrigger } from "~/components/time-picker/TimePickerTrigger/TimePickerTrigger";

/**
 * `TimePicker` 根组件不渲染 DOM，只组装 Context + Popover，
 * 并在"没有自定义 children"时回退到默认的 Trigger + Content。
 */

const trigger = (): HTMLElement =>
  document.querySelector('[data-slot="popover-trigger"]') as HTMLElement;
const content = (): HTMLElement | null =>
  document.querySelector('[data-slot="popover-content"]');

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("TimePicker - 默认子组件", () => {
  it("没有 children 时回退渲染默认触发器（无值时显示占位）", () => {
    render(() => <TimePicker />);

    expect(trigger()).toHaveTextContent("Pick a time");
    expect(content()).toBeNull();
  });

  it("defaultOpen 时渲染默认浮层与时间列", async () => {
    render(() => (
      <TimePicker defaultOpen defaultValue={new Date(2024, 0, 1, 9, 5)} />
    ));

    await vi.advanceTimersByTimeAsync(16);

    expect(content()).toBeInTheDocument();
    expect(screen.getAllByRole("listbox")).toHaveLength(2);
    expect(trigger()).toHaveTextContent("09:05");
  });
});

describe("TimePicker - 自定义子组件", () => {
  it("传了 children 时不再渲染默认子组件", () => {
    render(() => (
      <TimePicker>
        <TimePickerTrigger class="custom-trigger" />
      </TimePicker>
    ));

    expect(trigger()).toHaveClass("custom-trigger");
    // 只渲染自定义 trigger，没有默认 content
    expect(content()).toBeNull();
    expect(
      document.querySelectorAll('[data-slot="popover-trigger"]'),
    ).toHaveLength(1);
  });

  it("自定义 children 能读到祖先 Context（组合式用法）", () => {
    render(() => (
      <TimePicker
        value={new Date(2024, 0, 1, 15, 5)}
        hourCycle={12}
        locale="en-US"
      >
        <TimePickerTrigger />
      </TimePicker>
    ));

    expect(trigger()).toHaveTextContent("3:05 PM");
  });
});

describe("TimePicker - 开关透传", () => {
  it("点击默认触发器打开并回调 onOpenChange", () => {
    const onOpenChange = vi.fn();
    render(() => <TimePicker onOpenChange={onOpenChange} />);

    fireEvent.click(trigger());

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(content()).toBeInTheDocument();
  });

  it("受控 open=true 初始打开，点击后只回调关闭", () => {
    const onOpenChange = vi.fn();
    render(() => <TimePicker open onOpenChange={onOpenChange} />);

    expect(content()).toBeInTheDocument();

    fireEvent.click(trigger());

    expect(onOpenChange).toHaveBeenCalledWith(false);
    // 受控模式下组件不自行关闭
    expect(content()).toBeInTheDocument();
  });

  it("disabled 时触发器禁用、点击不打开", () => {
    const onOpenChange = vi.fn();
    render(() => <TimePicker disabled onOpenChange={onOpenChange} />);

    expect(trigger()).toBeDisabled();

    fireEvent.click(trigger());

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(content()).toBeNull();
  });
});
