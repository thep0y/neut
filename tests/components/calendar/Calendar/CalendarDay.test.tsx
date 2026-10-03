import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import {
  CalendarDay,
  type CalendarDayProps,
} from "~/components/calendar/Calendar/CalendarDay";
import type { CalendarClassNames } from "~/components/calendar/Calendar/Calendar.types";

/** 用可辨识的标记代替 Tailwind 类名，断言"命中了哪个插槽" */
function slotClass(key: keyof CalendarClassNames) {
  return `slot-${key}`;
}

function renderDay(props: Partial<CalendarDayProps> = {}) {
  const onSelect = vi.fn();
  const day = props.day ?? new Date(2024, 4, 15);
  const result = render(() => (
    <CalendarDay
      day={day}
      monthDate={new Date(2024, 4, 1)}
      mode="single"
      selected={undefined}
      showOutsideDays
      localeCode="zh-CN"
      slotClass={slotClass}
      onSelect={onSelect}
      {...props}
    />
  ));

  const cell = () => result.container.firstElementChild as HTMLElement;
  const button = () => result.container.querySelector("button") as HTMLElement;

  return { ...result, cell, button, onSelect, day };
}

describe("CalendarDay 基本渲染", () => {
  it("渲染日期数字与 data-day", () => {
    const { button, day } = renderDay();

    expect(button()).toHaveTextContent("15");
    expect(button()).toHaveAttribute(
      "data-day",
      day.toLocaleDateString("zh-CN"),
    );
  });

  it("未选中时没有选中相关属性", () => {
    const { cell, button } = renderDay();

    expect(cell()).not.toHaveAttribute("data-selected");
    expect(button()).toHaveAttribute("aria-pressed", "false");
    expect(button()).not.toHaveAttribute("data-selected-single");
  });

  it("当天套用 today 插槽", () => {
    const { cell } = renderDay({ day: new Date() });

    expect(cell()).toHaveClass("slot-today");
  });
});

describe("CalendarDay 选中态", () => {
  it("single 模式下选中日标记 data-selected / aria-pressed / data-selected-single", () => {
    const day = new Date(2024, 4, 15);
    const { cell, button } = renderDay({ mode: "single", selected: day });

    expect(cell()).toHaveAttribute("data-selected", "true");
    expect(button()).toHaveAttribute("aria-pressed", "true");
    expect(button()).toHaveAttribute("data-selected-single", "true");
  });

  it("multiple 模式下数组包含该日即选中，但不写 data-selected-single", () => {
    const { cell, button } = renderDay({
      mode: "multiple",
      selected: [new Date(2024, 4, 15), new Date(2024, 4, 20)],
    });

    expect(cell()).toHaveAttribute("data-selected", "true");
    expect(button()).not.toHaveAttribute("data-selected-single");
  });

  it("range 模式的起点/中点/终点分别标记并套用插槽", () => {
    const selected = { from: new Date(2024, 4, 13), to: new Date(2024, 4, 17) };

    const start = renderDay({
      mode: "range",
      selected,
      day: new Date(2024, 4, 13),
    });
    expect(start.button()).toHaveAttribute("data-range-start", "true");
    expect(start.cell()).toHaveClass("slot-range_start");

    const middle = renderDay({
      mode: "range",
      selected,
      day: new Date(2024, 4, 15),
    });
    expect(middle.button()).toHaveAttribute("data-range-middle", "true");
    expect(middle.cell()).toHaveClass("slot-range_middle");

    const end = renderDay({
      mode: "range",
      selected,
      day: new Date(2024, 4, 17),
    });
    expect(end.button()).toHaveAttribute("data-range-end", "true");
    expect(end.cell()).toHaveClass("slot-range_end");
  });
});

describe("CalendarDay 禁用与边界", () => {
  it("disabled=true 时按钮禁用并标记 aria-disabled", () => {
    const { cell, button, onSelect } = renderDay({ disabled: true });

    expect(button()).toBeDisabled();
    expect(cell()).toHaveAttribute("aria-disabled", "true");
    expect(cell()).toHaveClass("slot-disabled");

    fireEvent.click(button());
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("disabled 传函数时按日期判定", () => {
    const { button } = renderDay({
      disabled: (date) => date.getDate() === 15,
    });

    expect(button()).toBeDisabled();
  });

  it("事件派发前该天刚被禁用时不回调（点击守卫）", () => {
    // 闭包变量而不是信号：按钮不会重渲染，模拟"按钮刚被点下、判定已变为禁用"
    let disabled = false;
    const { button, onSelect } = renderDay({ disabled: () => disabled });
    expect(button()).not.toBeDisabled();

    disabled = true;
    fireEvent.click(button());

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("早于 min / 晚于 max 的日期被禁用", () => {
    const before = renderDay({
      day: new Date(2024, 4, 1),
      min: new Date(2024, 4, 10),
    });
    expect(before.button()).toBeDisabled();

    const after = renderDay({
      day: new Date(2024, 4, 20),
      max: new Date(2024, 4, 10),
    });
    expect(after.button()).toBeDisabled();
  });
});

describe("CalendarDay 非本月日期与点击", () => {
  it("非本月日期套用 outside（muted）", () => {
    const { cell, button } = renderDay({ day: new Date(2024, 3, 30) });

    expect(cell()).toHaveClass("slot-outside");
    expect(button()).toHaveClass("text-muted-foreground");
  });

  it("showOutsideDays=false 时非本月日期额外隐藏", () => {
    const { cell } = renderDay({
      day: new Date(2024, 3, 30),
      showOutsideDays: false,
    });

    expect(cell()).toHaveClass("slot-hidden");
  });

  it("点击正常日期回调 onSelect", () => {
    const day = new Date(2024, 4, 15);
    const { button, onSelect } = renderDay({ day });

    fireEvent.click(button());

    expect(onSelect).toHaveBeenCalledWith(day);
  });

  it("缺省 buttonVariant / localeCode 时用默认值渲染", () => {
    const day = new Date(2024, 4, 15);
    const { button } = renderDay({
      day,
      buttonVariant: undefined,
      localeCode: undefined,
    });

    // toLocaleDateString() 的默认区域，不断言具体格式，只断言属性存在
    expect(button().getAttribute("data-day")).toBeTruthy();
  });
});
