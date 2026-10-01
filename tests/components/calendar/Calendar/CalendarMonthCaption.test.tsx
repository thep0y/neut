import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { CalendarMonthCaption } from "~/components/calendar/Calendar/CalendarMonthCaption";
import type { CalendarClassNames } from "~/components/calendar/Calendar/Calendar.types";

function slotClass(key: keyof CalendarClassNames) {
  return `slot-${key}`;
}

const JUNE_2024 = new Date(2024, 5, 1);
const MONTH_OPTIONS = [
  { value: "0", label: "January" },
  { value: "5", label: "June" },
];
const YEAR_OPTIONS = [2020, 2024, 2025];

function renderCaption(
  props: Partial<Parameters<typeof CalendarMonthCaption>[0]> = {},
) {
  const onSelectMonth = vi.fn();
  const result = render(() => (
    <CalendarMonthCaption
      monthDate={JUNE_2024}
      captionLayout="label"
      localeCode="en-US"
      monthOptions={MONTH_OPTIONS}
      yearOptions={YEAR_OPTIONS}
      onSelectMonth={onSelectMonth}
      slotClass={slotClass}
      {...props}
    />
  ));

  const triggers = () =>
    Array.from(
      result.container.querySelectorAll<HTMLElement>('[role="combobox"]'),
    );
  // SelectContent 走 Portal 挂到 body，不在 render 容器内
  const optionsOf = (index: number) =>
    Array.from(
      document
        .querySelectorAll<HTMLElement>('[role="listbox"]')
        [index].querySelectorAll<HTMLElement>('[role="option"]'),
    );

  return { ...result, triggers, optionsOf, onSelectMonth };
}

async function waitForMount() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("CalendarMonthCaption", () => {
  it("label 布局渲染格式化后的月份标题，不渲染下拉", () => {
    const { container } = renderCaption();

    expect(container.querySelector(".slot-caption_label")).toHaveTextContent(
      "June 2024",
    );
    expect(container.querySelectorAll('[role="combobox"]')).toHaveLength(0);
  });

  it("dropdown 布局渲染月、年两个下拉且值跟着 monthDate", () => {
    const { triggers } = renderCaption({ captionLayout: "dropdown" });

    expect(triggers()).toHaveLength(2);
    expect(triggers()[0]).toHaveTextContent("June");
    expect(triggers()[1]).toHaveTextContent("2024");
  });

  it("选择月份时保留年份，并把日期归到当月 1 号", async () => {
    const { triggers, optionsOf, onSelectMonth } = renderCaption({
      captionLayout: "dropdown",
    });
    await waitForMount();

    fireEvent.click(triggers()[0]);
    fireEvent.click(optionsOf(0)[0]);

    expect(onSelectMonth).toHaveBeenCalledTimes(1);
    expect(onSelectMonth).toHaveBeenCalledWith(new Date(2024, 0, 1));
  });

  it("选择年份时保留当前月", async () => {
    const { triggers, optionsOf, onSelectMonth } = renderCaption({
      captionLayout: "dropdown",
    });
    await waitForMount();

    fireEvent.click(triggers()[1]);
    fireEvent.click(optionsOf(1)[0]);

    expect(onSelectMonth).toHaveBeenCalledTimes(1);
    expect(onSelectMonth).toHaveBeenCalledWith(new Date(2020, 5, 1));
  });
});
