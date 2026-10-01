import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Calendar } from "~/components/calendar/Calendar/Calendar";
import type { CalendarSelected } from "~/components/calendar/Calendar/Calendar.types";

/**
 * Calendar 的渲染与交互测试。
 *
 * 纯算法（选中态、禁用、下拉选项）已在 `Calendar.selection.test.ts` /
 * `Calendar.options.test.ts` 覆盖；这里只验证组件把它们正确接到 DOM 与 ARIA 上。
 * 固定 `defaultMonth` 让网格内容可预测。
 */

/** 2024-06-15（周六）所在月，网格覆盖 2024-05-26 ~ 2024-07-06 */
const JUNE_2024 = new Date(2024, 5, 1);

function renderCalendar(props: Record<string, unknown> = {}) {
  return render(() => (
    <Calendar defaultMonth={JUNE_2024} locale="en-US" {...props} />
  ));
}

/** 取出某一天的 <button>（按 data-day 的本地化日期串定位） */
function dayButton(day: Date): HTMLButtonElement | null {
  const key = day.toLocaleDateString("en-US");
  return document.querySelector(
    `button[data-day="${key}"]`,
  ) as HTMLButtonElement | null;
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Calendar - 结构", () => {
  it("根元素带 data-slot 与默认月份网格", () => {
    const { container } = renderCalendar();

    expect(container.querySelector('[data-slot="calendar"]')).not.toBeNull();
    // 2024-06 的网格是 6 周 × 7 天 = 42 个日期按钮
    expect(document.querySelectorAll("button[data-day]").length).toBe(42);
  });

  it("渲染 7 个星期标题", () => {
    const { container } = renderCalendar();

    const weekdayRow = container.querySelectorAll(
      '[class*="flex-1"][class*="text-\\[0.8rem\\]"]',
    );
    expect(weekdayRow.length).toBe(7);
  });

  it("标题默认显示月份与年份", () => {
    renderCalendar();

    expect(document.body.textContent).toContain("June 2024");
  });

  it("显示今天时带 today 样式（不报错即可）", () => {
    expect(() => renderCalendar()).not.toThrow();
  });

  it("showWeekNumber 时渲染周数列", () => {
    const { container } = renderCalendar({ showWeekNumber: true });

    // 表头多一格 + 每周多一格
    expect(container.textContent).toContain("23"); // 2024-05-26 所在 ISO 周
  });

  it("classNames 覆盖可作用于具体槽位", () => {
    const { container } = renderCalendar({
      classNames: { month: "my-month-slot" },
    });

    expect(container.querySelector(".my-month-slot")).not.toBeNull();
  });
});

describe("Calendar - single 模式", () => {
  it("非受控：点击某天选中并回调", () => {
    const onSelect = vi.fn();
    renderCalendar({ onSelect });

    fireEvent.click(dayButton(new Date(2024, 5, 15))!);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toEqual(new Date(2024, 5, 15));
    expect(dayButton(new Date(2024, 5, 15))).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("非受控：再次点击同一天取消选中", () => {
    const onSelect = vi.fn();
    renderCalendar({ onSelect });
    const day = dayButton(new Date(2024, 5, 15))!;

    fireEvent.click(day);
    fireEvent.click(dayButton(new Date(2024, 5, 15))!);

    expect(onSelect).toHaveBeenLastCalledWith(undefined);
    expect(dayButton(new Date(2024, 5, 15))).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("受控：点击只回调，UI 由外部 selected 决定", () => {
    const onSelect = vi.fn();
    renderCalendar({ selected: new Date(2024, 5, 15), onSelect });

    fireEvent.click(dayButton(new Date(2024, 5, 16))!);

    expect(onSelect).toHaveBeenCalledWith(new Date(2024, 5, 16));
    // 未回写 → 仍显示原来选中的 15 号
    expect(dayButton(new Date(2024, 5, 15))).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(dayButton(new Date(2024, 5, 16))).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("受控：外部改变 selected 后 UI 跟随", async () => {
    const [selected, setSelected] = createSignal<CalendarSelected>(
      new Date(2024, 5, 15),
    );
    renderCalendar({
      get selected() {
        return selected();
      },
    });

    setSelected(new Date(2024, 5, 16));
    await Promise.resolve();

    expect(dayButton(new Date(2024, 5, 16))).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("defaultSelected 决定初始选中态", () => {
    renderCalendar({ defaultSelected: new Date(2024, 5, 10) });

    expect(dayButton(new Date(2024, 5, 10))).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("选中时带 data-selected-single（驱动主色样式）", () => {
    renderCalendar({ defaultSelected: new Date(2024, 5, 10) });

    expect(dayButton(new Date(2024, 5, 10))).toHaveAttribute(
      "data-selected-single",
      "true",
    );
  });

  it("未选中时不带 data-selected-single", () => {
    renderCalendar();

    expect(dayButton(new Date(2024, 5, 10))).not.toHaveAttribute(
      "data-selected-single",
    );
  });
});

describe("Calendar - multiple 模式", () => {
  it("依次点击累加选中项", () => {
    const onSelect = vi.fn();
    renderCalendar({ mode: "multiple", onSelect });

    fireEvent.click(dayButton(new Date(2024, 5, 10))!);
    fireEvent.click(dayButton(new Date(2024, 5, 12))!);

    expect(onSelect).toHaveBeenLastCalledWith([
      new Date(2024, 5, 10),
      new Date(2024, 5, 12),
    ]);
    expect(dayButton(new Date(2024, 5, 10))).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("再次点击已选日期取消它", () => {
    const onSelect = vi.fn();
    renderCalendar({
      mode: "multiple",
      defaultSelected: [new Date(2024, 5, 10)],
      onSelect,
    });

    fireEvent.click(dayButton(new Date(2024, 5, 10))!);

    expect(onSelect).toHaveBeenLastCalledWith([]);
  });
});

describe("Calendar - range 模式", () => {
  it("第一次点击设起点，第二次形成区间", () => {
    const onSelect = vi.fn();
    renderCalendar({ mode: "range", onSelect });

    fireEvent.click(dayButton(new Date(2024, 5, 10))!);
    expect(onSelect).toHaveBeenLastCalledWith({ from: new Date(2024, 5, 10) });

    fireEvent.click(dayButton(new Date(2024, 5, 15))!);
    expect(onSelect).toHaveBeenLastCalledWith({
      from: new Date(2024, 5, 10),
      to: new Date(2024, 5, 15),
    });
  });

  it("区间内各天分别带 start / middle / end 标记", () => {
    renderCalendar({
      mode: "range",
      defaultSelected: {
        from: new Date(2024, 5, 10),
        to: new Date(2024, 5, 15),
      },
    });

    expect(dayButton(new Date(2024, 5, 10))).toHaveAttribute(
      "data-range-start",
      "true",
    );
    expect(dayButton(new Date(2024, 5, 12))).toHaveAttribute(
      "data-range-middle",
      "true",
    );
    expect(dayButton(new Date(2024, 5, 15))).toHaveAttribute(
      "data-range-end",
      "true",
    );
  });

  it("区间外的日期没有任何范围标记", () => {
    renderCalendar({
      mode: "range",
      defaultSelected: {
        from: new Date(2024, 5, 10),
        to: new Date(2024, 5, 15),
      },
    });

    const outside = dayButton(new Date(2024, 5, 20))!;
    expect(outside).not.toHaveAttribute("data-range-start");
    expect(outside).not.toHaveAttribute("data-range-middle");
    expect(outside).not.toHaveAttribute("data-range-end");
  });

  it("区间内部日期 aria-pressed 为 true", () => {
    renderCalendar({
      mode: "range",
      defaultSelected: {
        from: new Date(2024, 5, 10),
        to: new Date(2024, 5, 15),
      },
    });

    expect(dayButton(new Date(2024, 5, 12))).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

describe("Calendar - 禁用与边界", () => {
  it("disabled=true 时所有日期按钮都禁用且点击不回调", () => {
    const onSelect = vi.fn();
    renderCalendar({ disabled: true, onSelect });

    const btn = dayButton(new Date(2024, 5, 10))!;
    expect(btn).toBeDisabled();

    fireEvent.click(btn);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("disabled 函数只禁用命中的日期", () => {
    renderCalendar({ disabled: (d: Date) => d.getDate() === 10 });

    expect(dayButton(new Date(2024, 5, 10))).toBeDisabled();
    expect(dayButton(new Date(2024, 5, 11))).not.toBeDisabled();
  });

  it("超出 min / max 的日期被禁用，区间内的可用", () => {
    renderCalendar({ min: new Date(2024, 5, 10), max: new Date(2024, 5, 20) });

    expect(dayButton(new Date(2024, 5, 9))).toBeDisabled();
    expect(dayButton(new Date(2024, 5, 15))).not.toBeDisabled();
    expect(dayButton(new Date(2024, 5, 21))).toBeDisabled();
  });

  it("到达 min 时『上一月』按钮禁用", () => {
    const { container } = renderCalendar({ min: JUNE_2024 });

    expect(
      container.querySelector('button[aria-label="Previous month"]'),
    ).toBeDisabled();
  });

  it("到达 max 时『下一月』按钮禁用", () => {
    const { container } = renderCalendar({ max: JUNE_2024 });

    expect(
      container.querySelector('button[aria-label="Next month"]'),
    ).toBeDisabled();
  });

  it("未到边界时两个导航按钮都可用", () => {
    const { container } = renderCalendar({
      min: new Date(2020, 0, 1),
      max: new Date(2030, 0, 1),
    });

    expect(
      container.querySelector('button[aria-label="Previous month"]'),
    ).not.toBeDisabled();
    expect(
      container.querySelector('button[aria-label="Next month"]'),
    ).not.toBeDisabled();
  });
});

describe("Calendar - 月份导航", () => {
  it("点『下一月』切到下个月并回调 onMonthChange", () => {
    const onMonthChange = vi.fn();
    renderCalendar({ onMonthChange });

    fireEvent.click(document.querySelector('button[aria-label="Next month"]')!);

    expect(onMonthChange).toHaveBeenCalledWith(new Date(2024, 6, 1));
    expect(document.body.textContent).toContain("July 2024");
  });

  it("点『上一月』切到上个月", () => {
    renderCalendar();

    fireEvent.click(
      document.querySelector('button[aria-label="Previous month"]')!,
    );

    expect(document.body.textContent).toContain("May 2024");
  });

  it("受控 month：点击只回调，不外写内部状态", () => {
    const onMonthChange = vi.fn();
    renderCalendar({ month: JUNE_2024, onMonthChange });

    fireEvent.click(document.querySelector('button[aria-label="Next month"]')!);

    expect(onMonthChange).toHaveBeenCalledWith(new Date(2024, 6, 1));
    expect(document.body.textContent).toContain("June 2024");
  });

  it("numberOfMonths=2 时同时渲染两个月份", () => {
    renderCalendar({ numberOfMonths: 2 });

    expect(document.body.textContent).toContain("June 2024");
    expect(document.body.textContent).toContain("July 2024");
  });

  it("weekStartsOn=1 时网格从周一开始", () => {
    renderCalendar({ weekStartsOn: 1 });

    // 2024-06 的网格首格应为 2024-05-27（周一）
    const days = document.querySelectorAll("button[data-day]");
    expect(days[0].getAttribute("data-day")).toBe(
      new Date(2024, 4, 27).toLocaleDateString("en-US"),
    );
  });

  it("weekStartsOn=0（默认）时网格从周日起", () => {
    renderCalendar();

    // 2024-06 的网格首格应为 2024-05-26（周日）
    const days = document.querySelectorAll("button[data-day]");
    expect(days[0].getAttribute("data-day")).toBe(
      new Date(2024, 4, 26).toLocaleDateString("en-US"),
    );
  });
});

describe("Calendar - captionLayout", () => {
  it("dropdown 布局渲染月份与年份两个下拉", () => {
    renderCalendar({ captionLayout: "dropdown" });

    expect(document.querySelectorAll('[role="combobox"]').length).toBe(2);
  });

  it("label 布局时不渲染下拉", () => {
    renderCalendar({ captionLayout: "label" });

    expect(document.querySelectorAll('[role="combobox"]').length).toBe(0);
  });

  it("month 受控且 captionLayout=dropdown 时不报错", () => {
    expect(() =>
      renderCalendar({ captionLayout: "dropdown", month: JUNE_2024 }),
    ).not.toThrow();
  });
});

describe("Calendar - 透传", () => {
  it("class 合并到根元素", () => {
    const { container } = renderCalendar({ class: "my-calendar" });

    expect(container.querySelector('[data-slot="calendar"]')).toHaveClass(
      "my-calendar",
    );
  });

  it("dir 透传到根元素", () => {
    const { container } = renderCalendar({ dir: "rtl" });

    expect(container.querySelector('[data-slot="calendar"]')).toHaveAttribute(
      "dir",
      "rtl",
    );
  });

  it("style 透传到根元素", () => {
    const { container } = renderCalendar({ style: { "max-width": "300px" } });

    const root = container.querySelector(
      '[data-slot="calendar"]',
    ) as HTMLElement;
    expect(root.style.maxWidth).toBe("300px");
  });

  it("buttonVariant 影响日期按钮的 class", () => {
    const { container } = renderCalendar({ buttonVariant: "outline" });

    expect(container.querySelector("button[data-day]")?.className).toContain(
      "outline",
    );
  });

  it("locale 为 { code } 对象时同样生效", () => {
    renderCalendar({ locale: { code: "en-US" } });

    expect(document.body.textContent).toContain("June 2024");
  });
});
