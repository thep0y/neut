import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DatePicker } from "~/components/date-picker/DatePicker/DatePicker";

/**
 * DatePicker 集成测试：真实的 Popover + Calendar 组合。
 *
 * 覆盖 trigger 开关浮层、点选日期后回调并关闭、受控模式、
 * min/max 禁用、以及各层 class 透传。
 * 固定 `defaultValue` 与 `locale="en-US"`，让月份网格与 Intl 文本可预测。
 */
const APRIL_29_2025 = new Date(2025, 3, 29);

function triggerOf(container: HTMLElement): HTMLButtonElement {
  return container.querySelector(
    '[data-slot="popover-trigger"]',
  ) as HTMLButtonElement;
}

function content(): HTMLElement | null {
  return document.querySelector('[data-slot="popover-content"]');
}

function calendarRoot(): HTMLElement | null {
  return document.querySelector('[data-slot="calendar"]');
}

/** 按 `data-day` 的本地化日期串取出某一天的按钮 */
function dayButton(day: Date): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(
    `button[data-day="${day.toLocaleDateString("en-US")}"]`,
  );
}

function openPicker(container: HTMLElement): void {
  fireEvent.click(triggerOf(container));
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("DatePicker - 浮层开关", () => {
  it("点击 trigger 打开浮层并渲染日历，ARIA 与 data-state 同步", () => {
    const { container } = render(() => (
      <DatePicker defaultValue={APRIL_29_2025} locale="en-US" />
    ));

    expect(content()).toBeNull();
    expect(calendarRoot()).toBeNull();

    openPicker(container);

    expect(content()).not.toBeNull();
    expect(calendarRoot()).not.toBeNull();
    expect(triggerOf(container).getAttribute("aria-expanded")).toBe("true");
    expect(triggerOf(container).getAttribute("data-state")).toBe("open");
    // 默认 align=start：PopoverContent 的 data-align 由最终 placement 推导
    expect(content()?.getAttribute("data-align")).toBe("start");
  });

  it("disabled 时点击 trigger 不打开浮层", () => {
    const { container } = render(() => <DatePicker disabled />);

    openPicker(container);

    expect(content()).toBeNull();
    expect(triggerOf(container).disabled).toBe(true);
  });

  it("键盘：Enter / ArrowDown 打开浮层，Escape 关闭", () => {
    const { container } = render(() => (
      <DatePicker defaultValue={APRIL_29_2025} locale="en-US" />
    ));

    fireEvent.keyDown(triggerOf(container), { key: "Enter" });
    expect(calendarRoot()).not.toBeNull();

    fireEvent.keyDown(triggerOf(container), { key: "Escape" });
    expect(content()).toBeNull();

    fireEvent.keyDown(triggerOf(container), { key: "ArrowDown" });
    expect(calendarRoot()).not.toBeNull();
  });
});

describe("DatePicker - 选择日期", () => {
  it("非受控：点选某天回调该日期、关闭浮层并更新展示文本", () => {
    const onValueChange = vi.fn();
    const { container } = render(() => (
      <DatePicker
        defaultValue={APRIL_29_2025}
        locale="en-US"
        onValueChange={onValueChange}
      />
    ));

    openPicker(container);
    const target = new Date(2025, 3, 15);
    fireEvent.click(dayButton(target)!);

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange.mock.calls[0][0]).toEqual(target);
    expect(content()).toBeNull();
    expect(triggerOf(container).textContent).toContain("April 15, 2025");
    expect(triggerOf(container).hasAttribute("data-empty")).toBe(false);
  });

  it("没有 onValueChange 时点选也不报错，选中态写回日历", () => {
    const { container } = render(() => (
      <DatePicker defaultValue={APRIL_29_2025} locale="en-US" />
    ));

    openPicker(container);
    fireEvent.click(dayButton(new Date(2025, 3, 15))!);
    openPicker(container);

    expect(dayButton(new Date(2025, 3, 15))?.getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(
      dayButton(new Date(2025, 3, 15))?.getAttribute("data-selected-single"),
    ).toBe("true");
    expect(triggerOf(container).textContent).toContain("April 15, 2025");
  });

  it("受控：点选只回调 onValueChange，展示文本等外部回写", () => {
    const [value, setValue] = createSignal<Date | undefined>(APRIL_29_2025);
    const onValueChange = vi.fn();
    const { container } = render(() => (
      <DatePicker
        value={value()}
        locale="en-US"
        onValueChange={onValueChange}
      />
    ));

    openPicker(container);
    const target = new Date(2025, 3, 10);
    fireEvent.click(dayButton(target)!);

    expect(onValueChange).toHaveBeenLastCalledWith(target);
    expect(triggerOf(container).textContent).toContain("April 29, 2025");

    setValue(target);
    expect(triggerOf(container).textContent).toContain("April 10, 2025");
  });

  it("min / max 之外的日期禁用，点击不回调", () => {
    const onValueChange = vi.fn();
    const { container } = render(() => (
      <DatePicker
        defaultValue={APRIL_29_2025}
        locale="en-US"
        min={new Date(2025, 3, 10)}
        max={new Date(2025, 3, 20)}
        onValueChange={onValueChange}
      />
    ));

    openPicker(container);
    const tooEarly = dayButton(new Date(2025, 3, 5))!;
    const tooLate = dayButton(new Date(2025, 3, 25))!;

    expect(tooEarly.disabled).toBe(true);
    expect(tooLate.disabled).toBe(true);

    fireEvent.click(tooEarly);
    fireEvent.click(tooLate);
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe("DatePicker - class 与属性透传", () => {
  it("contentClass / calendarClass / classNames / dir 分别落到对应层", () => {
    const { container } = render(() => (
      <DatePicker
        defaultValue={APRIL_29_2025}
        locale="en-US"
        contentClass="my-content"
        calendarClass="my-calendar"
        classNames={{ root: "my-cal-root" }}
        align="end"
        side="top"
        dir="rtl"
      />
    ));

    openPicker(container);

    expect(content()?.className).toContain("my-content");
    expect(content()?.getAttribute("data-align")).toBe("end");
    expect(["top", "bottom", "left", "right"]).toContain(
      content()?.getAttribute("data-side"),
    );
    expect(calendarRoot()?.className).toContain("my-calendar");
    expect(calendarRoot()?.className).toContain("my-cal-root");
    expect(calendarRoot()?.getAttribute("dir")).toBe("rtl");
  });
});
