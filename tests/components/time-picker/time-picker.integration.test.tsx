import { fireEvent, render, screen, within } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TimePicker } from "~/components/time-picker/TimePicker/TimePicker";
import type {
  TimePickerChangeEventDetails,
  TimePickerProps,
} from "~/components/time-picker/TimePicker/TimePicker.types";
import { TimePickerContent } from "~/components/time-picker/TimePickerContent/TimePickerContent";
import { TimePickerTrigger } from "~/components/time-picker/TimePickerTrigger/TimePickerTrigger";

/**
 * TimePicker 整机集成：根 Context + Popover + Trigger + Content + Column + Option
 * 串起来后的用户可见行为（开关、ARIA、键盘、受控/非受控、事件详情）。
 *
 * jsdom 不做布局，浮层坐标由 positioner 单测覆盖；这里只断言状态与语义。
 * fake timers 用于驱动"打开后下一帧聚焦第一列"的 rAF。
 */

const trigger = (): HTMLElement =>
  document.querySelector('[data-slot="popover-trigger"]') as HTMLElement;
const content = (): HTMLElement | null =>
  document.querySelector('[data-slot="popover-content"]');
const listbox = (name: string): HTMLElement =>
  screen.getByRole("listbox", { name });
const optionAt = (name: string, label: string): HTMLElement =>
  within(listbox(name)).getByRole("option", { name: label });

/** 2024-01-01 09:05:00，字段固定便于手写期望值 */
function morning(): Date {
  return new Date(2024, 0, 1, 9, 5, 0);
}

function renderTimePicker(props: Partial<TimePickerProps> = {}) {
  return render(() => <TimePicker {...props} />);
}

/** 打开浮层并等一帧（第一列聚焦发生在 rAF 里） */
async function advanceFrame(): Promise<void> {
  await vi.advanceTimersByTimeAsync(16);
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("TimePicker 集成 - 打开与关闭", () => {
  it("点击触发器打开浮层，ARIA 与 data-state 联动", () => {
    renderTimePicker();

    expect(content()).toBeNull();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveAttribute("data-state", "closed");

    fireEvent.click(trigger());

    expect(content()).toBeInTheDocument();
    expect(content()).toHaveAttribute("role", "dialog");
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAttribute("aria-controls", content()!.id);
  });

  it("打开后下一帧把焦点移入第一列（Hour）", async () => {
    renderTimePicker({ defaultOpen: true });

    await advanceFrame();

    expect(document.activeElement).toBe(listbox("Hour"));
  });

  it("Escape 关闭浮层", () => {
    renderTimePicker({ defaultOpen: true });

    fireEvent.keyDown(listbox("Hour"), { key: "Escape" });

    expect(content()).toBeNull();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("点击浮层之外关闭", () => {
    renderTimePicker({ defaultOpen: true });

    fireEvent.pointerDown(document.body);

    expect(content()).toBeNull();
  });

  it("再次点击触发器关闭", () => {
    renderTimePicker({ defaultOpen: true });

    fireEvent.click(trigger());

    expect(content()).toBeNull();
  });
});

describe("TimePicker 集成 - 默认 24 小时制", () => {
  it("渲染 Hour / Minute 两列，选项数量与 aria-label 正确", () => {
    renderTimePicker({ defaultOpen: true });

    expect(within(listbox("Hour")).getAllByRole("option")).toHaveLength(24);
    expect(within(listbox("Minute")).getAllByRole("option")).toHaveLength(60);
  });

  it("触发器展示格式化时间，有值时 data-empty=false", () => {
    renderTimePicker({ defaultOpen: true, defaultValue: morning() });

    expect(trigger()).toHaveTextContent("09:05");
    expect(trigger()).toHaveAttribute("data-empty", "false");
  });

  it("aria-selected 与 aria-activedescendant 跟随当前值", () => {
    renderTimePicker({ defaultOpen: true, defaultValue: morning() });

    const hour = listbox("Hour");
    const selected = optionAt("Hour", "09");

    expect(selected).toHaveAttribute("aria-selected", "true");
    expect(hour).toHaveAttribute("aria-activedescendant", selected.id);
  });
});

describe("TimePicker 集成 - 选择与事件详情", () => {
  it("点击选项提交新时间，reason=option-press，trigger 是选项元素", () => {
    const onValueChange = vi.fn();
    renderTimePicker({
      defaultOpen: true,
      defaultValue: morning(),
      onValueChange,
    });

    const option = optionAt("Hour", "10");
    fireEvent.click(option);

    const [value, details] = onValueChange.mock.calls[0] as [
      Date,
      TimePickerChangeEventDetails,
    ];
    expect(value.getHours()).toBe(10);
    expect(value.getMinutes()).toBe(5);
    expect(details.reason).toBe("option-press");
    expect(details.trigger).toBe(option);
    expect(details.isCanceled).toBe(false);
  });

  it("非受控：选择后内部值与触发器文本、选中态一起更新", () => {
    renderTimePicker({ defaultOpen: true, defaultValue: morning() });

    fireEvent.click(optionAt("Hour", "10"));

    expect(trigger()).toHaveTextContent("10:05");
    expect(optionAt("Hour", "10")).toHaveAttribute("aria-selected", "true");
    expect(optionAt("Hour", "09")).toHaveAttribute("aria-selected", "false");
  });

  it("回调里 cancel() 阻止本次提交（非受控内部值不变）", () => {
    renderTimePicker({
      defaultOpen: true,
      defaultValue: morning(),
      onValueChange: (_value, details) => details.cancel(),
    });

    fireEvent.click(optionAt("Hour", "10"));

    expect(trigger()).toHaveTextContent("09:05");
    expect(optionAt("Hour", "09")).toHaveAttribute("aria-selected", "true");
  });

  it("选择分钟后只改分钟，小时与日期不变", () => {
    const onValueChange = vi.fn();
    renderTimePicker({
      defaultOpen: true,
      defaultValue: morning(),
      onValueChange,
    });

    fireEvent.click(optionAt("Minute", "45"));

    const value = onValueChange.mock.calls[0]![0] as Date;
    expect(value.getDate()).toBe(1);
    expect(value.getHours()).toBe(9);
    expect(value.getMinutes()).toBe(45);
    expect(trigger()).toHaveTextContent("09:45");
  });
});

describe("TimePicker 集成 - 键盘", () => {
  it("ArrowDown / ArrowUp 在列内推进并提交，reason=keyboard，trigger 是列本身", () => {
    const onValueChange = vi.fn();
    renderTimePicker({
      defaultOpen: true,
      defaultValue: morning(),
      onValueChange,
    });

    const hour = listbox("Hour");
    hour.focus();
    fireEvent.keyDown(hour, { key: "ArrowDown" });

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect((onValueChange.mock.calls[0]![0] as Date).getHours()).toBe(10);
    expect(onValueChange.mock.calls[0]![1].reason).toBe("keyboard");
    expect(onValueChange.mock.calls[0]![1].trigger).toBe(hour);

    fireEvent.keyDown(hour, { key: "ArrowUp" });

    expect((onValueChange.mock.calls[1]![0] as Date).getHours()).toBe(9);
  });

  it("Home / End 跳到列首尾", () => {
    renderTimePicker({ defaultOpen: true, defaultValue: morning() });

    const hour = listbox("Hour");
    hour.focus();
    fireEvent.keyDown(hour, { key: "Home" });
    expect(trigger()).toHaveTextContent("00:05");

    fireEvent.keyDown(hour, { key: "End" });
    expect(trigger()).toHaveTextContent("23:05");
  });

  it("ArrowRight / ArrowLeft 在列之间移动焦点", () => {
    renderTimePicker({ defaultOpen: true, defaultValue: morning() });

    const hour = listbox("Hour");
    hour.focus();

    fireEvent.keyDown(hour, { key: "ArrowRight" });
    expect(document.activeElement).toBe(listbox("Minute"));

    fireEvent.keyDown(listbox("Minute"), { key: "ArrowLeft" });
    expect(document.activeElement).toBe(listbox("Hour"));
  });

  it("12 小时制 + RTL 下 ArrowRight 指向最后一列（语义取反）", () => {
    renderTimePicker({
      defaultOpen: true,
      hourCycle: 12,
      locale: "en-US",
      dir: "rtl",
    });

    const hour = listbox("Hour");
    hour.focus();
    fireEvent.keyDown(hour, { key: "ArrowRight" });

    expect(document.activeElement).toBe(listbox("AM/PM"));
  });

  it("Enter / Space 不改变值（移动即提交，按键只阻止页面滚动）", () => {
    const onValueChange = vi.fn();
    renderTimePicker({
      defaultOpen: true,
      defaultValue: morning(),
      onValueChange,
    });

    const hour = listbox("Hour");
    hour.focus();
    fireEvent.keyDown(hour, { key: "Enter" });
    fireEvent.keyDown(hour, { key: " " });

    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("TimePicker 集成 - 12 小时制与秒", () => {
  it("12 小时制渲染 Hour / Minute / AM/PM 三列并本地化文案", () => {
    renderTimePicker({
      defaultOpen: true,
      hourCycle: 12,
      locale: "en-US",
      defaultValue: morning(),
    });

    expect(within(listbox("Hour")).getAllByRole("option")).toHaveLength(12);
    expect(within(listbox("AM/PM")).getAllByRole("option")).toHaveLength(2);
    expect(optionAt("AM/PM", "AM")).toHaveAttribute("aria-selected", "true");
    expect(trigger()).toHaveTextContent("9:05 AM");
  });

  it("选择 PM 把上午时间推到下午", () => {
    renderTimePicker({
      defaultOpen: true,
      hourCycle: 12,
      locale: "en-US",
      defaultValue: morning(),
    });

    fireEvent.click(optionAt("AM/PM", "PM"));

    expect(trigger()).toHaveTextContent("9:05 PM");
    expect(optionAt("Hour", "09")).toHaveAttribute("aria-selected", "true");
  });

  it("showSeconds 追加秒列并参与格式化", () => {
    renderTimePicker({
      defaultOpen: true,
      showSeconds: true,
      defaultValue: new Date(2024, 0, 1, 9, 5, 7),
    });

    expect(within(listbox("Second")).getAllByRole("option")).toHaveLength(60);
    expect(trigger()).toHaveTextContent("09:05:07");

    fireEvent.click(optionAt("Second", "30"));
    expect(trigger()).toHaveTextContent("09:05:30");
  });

  it("minuteStep=15 时不在步长上的值不产生悬空高亮", () => {
    renderTimePicker({
      defaultOpen: true,
      minuteStep: 15,
      defaultValue: new Date(2024, 0, 1, 9, 7),
    });

    expect(within(listbox("Minute")).getAllByRole("option")).toHaveLength(4);
    expect(listbox("Minute")).not.toHaveAttribute("aria-activedescendant");
  });
});

describe("TimePicker 集成 - 受控模式", () => {
  it("受控：只回调 onValueChange，展示文本与选中态不变", () => {
    const onValueChange = vi.fn();
    renderTimePicker({
      defaultOpen: true,
      value: morning(),
      onValueChange,
    });

    fireEvent.click(optionAt("Hour", "10"));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect((onValueChange.mock.calls[0]![0] as Date).getHours()).toBe(10);
    expect(trigger()).toHaveTextContent("09:05");
    expect(optionAt("Hour", "09")).toHaveAttribute("aria-selected", "true");
  });

  it("受控：外部回写 value 后 UI 跟随", () => {
    const [value, setValue] = createSignal<Date | undefined>(morning());
    render(() => (
      <TimePicker
        defaultOpen
        value={value()}
        onValueChange={(next) => setValue(next)}
      />
    ));

    fireEvent.click(optionAt("Hour", "10"));

    expect(trigger()).toHaveTextContent("10:05");
    expect(optionAt("Hour", "10")).toHaveAttribute("aria-selected", "true");
  });
});

describe("TimePicker 集成 - 禁用与只读", () => {
  it("disabled：触发器禁用，无法打开", () => {
    renderTimePicker({ disabled: true });

    expect(trigger()).toBeDisabled();
    fireEvent.click(trigger());
    expect(content()).toBeNull();
  });

  it("readOnly：可以打开与聚焦，但键盘与点击都不提交", async () => {
    const onValueChange = vi.fn();
    renderTimePicker({
      defaultOpen: true,
      readOnly: true,
      defaultValue: morning(),
      onValueChange,
    });

    await advanceFrame();
    const hour = listbox("Hour");
    expect(document.activeElement).toBe(hour);

    fireEvent.keyDown(hour, { key: "ArrowDown" });
    fireEvent.click(optionAt("Hour", "10"));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger()).toHaveTextContent("09:05");
  });
});

describe("TimePicker 集成 - 组合式用法与初始聚焦", () => {
  it("自定义 Trigger + Content 组合也能正常开关与选择", () => {
    const onValueChange = vi.fn();
    render(() => (
      <TimePicker defaultValue={morning()} onValueChange={onValueChange}>
        <TimePickerTrigger />
        <TimePickerContent />
      </TimePicker>
    ));

    fireEvent.click(trigger());
    expect(content()).toBeInTheDocument();

    fireEvent.click(optionAt("Minute", "30"));

    expect((onValueChange.mock.calls[0]![0] as Date).getMinutes()).toBe(30);
    expect(trigger()).toHaveTextContent("09:30");
  });
});
