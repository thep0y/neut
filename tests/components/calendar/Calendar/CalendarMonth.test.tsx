import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { CalendarMonth } from "~/components/calendar/Calendar/CalendarMonth";
import type { CalendarClassNames } from "~/components/calendar/Calendar/Calendar.types";

function slotClass(key: keyof CalendarClassNames) {
  return `slot-${key}`;
}

const JUNE_2024 = new Date(2024, 5, 1);

function renderMonth(props: Partial<Parameters<typeof CalendarMonth>[0]> = {}) {
  const onMoveMonth = vi.fn();
  const onSelectMonth = vi.fn();
  const onSelectDay = vi.fn();
  const result = render(() => (
    <CalendarMonth
      monthDate={JUNE_2024}
      canPrev
      canNext
      onMoveMonth={onMoveMonth}
      captionLayout="label"
      localeCode="en-US"
      monthOptions={() => []}
      yearOptions={[]}
      onSelectMonth={onSelectMonth}
      weekStartsOn={0}
      mode="single"
      selected={undefined}
      showOutsideDays
      slotClass={slotClass}
      onSelectDay={onSelectDay}
      {...props}
    />
  ));

  const month = () =>
    result.container.querySelector(".slot-month") as HTMLElement;
  const navButtons = () =>
    Array.from(
      result.container.querySelectorAll<HTMLButtonElement>(".slot-nav button"),
    );
  const dayCells = () =>
    Array.from(result.container.querySelectorAll<HTMLElement>(".slot-day"));

  return { ...result, month, navButtons, dayCells, onMoveMonth, onSelectDay };
}

describe("CalendarMonth 导航", () => {
  it("渲染上月/下月按钮并带上插槽类名", () => {
    const { navButtons } = renderMonth();

    expect(navButtons()).toHaveLength(2);
    expect(navButtons()[0]).toHaveAccessibleName("Previous month");
    expect(navButtons()[0]).toHaveClass("slot-button_previous");
    expect(navButtons()[1]).toHaveAccessibleName("Next month");
    expect(navButtons()[1]).toHaveClass("slot-button_next");
  });

  it("点击导航按钮按方向回调", () => {
    const { navButtons, onMoveMonth } = renderMonth();

    fireEvent.click(navButtons()[0]);
    expect(onMoveMonth).toHaveBeenLastCalledWith(-1);

    fireEvent.click(navButtons()[1]);
    expect(onMoveMonth).toHaveBeenLastCalledWith(1);
  });

  it("canPrev / canNext 为 false 时按钮禁用", () => {
    const { navButtons } = renderMonth({ canPrev: false, canNext: false });

    expect(navButtons()[0]).toBeDisabled();
    expect(navButtons()[1]).toBeDisabled();
  });
});

describe("CalendarMonth 网格", () => {
  it("渲染 7 个星期表头", () => {
    const { container } = renderMonth();

    expect(container.querySelectorAll(".slot-weekday")).toHaveLength(7);
  });

  it("2024-06 的网格覆盖 05-26 ~ 07-06，共 6 周 42 格", () => {
    const { container, dayCells } = renderMonth();

    expect(container.querySelectorAll(".slot-week")).toHaveLength(6);
    expect(dayCells()).toHaveLength(42);
  });

  it("showWeekNumber 时渲染周序号表头与每周的周号", () => {
    const { container } = renderMonth({ showWeekNumber: true });

    expect(container.querySelectorAll(".slot-week_number_header")).toHaveLength(
      1,
    );
    // 第一周（05-26 起）属于 2024 年第 21 周
    expect(container.querySelector(".slot-week_number")).toHaveTextContent(
      "21",
    );
  });

  it("点击某天回调 onSelectDay", () => {
    const { dayCells, onSelectDay } = renderMonth();

    fireEvent.click(dayCells()[0].querySelector("button") as HTMLElement);

    expect(onSelectDay).toHaveBeenCalledWith(new Date(2024, 4, 26));
  });

  it("captionLayout=dropdown 时把标题换成两个下拉", () => {
    const { container } = renderMonth({ captionLayout: "dropdown" });

    expect(container.querySelectorAll('[role="combobox"]')).toHaveLength(2);
  });
});
