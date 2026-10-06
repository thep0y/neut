import { fireEvent, render, screen, within } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TimePickerContext } from "~/components/time-picker/TimePicker/TimePicker.context";
import { TimePickerColumn } from "~/components/time-picker/TimePickerColumn/TimePickerColumn";
import {
  createFakeTimePickerContext,
  smallOptions,
} from "~tests/components/time-picker/test-utils";

/**
 * `TimePickerColumn` 把 `useTimePickerColumn` 的结果渲染成
 * `role="listbox"` + `role="option"`，选中/高亮全走 ARIA 与 `data-*`。
 */

function renderColumn(
  options: {
    unit?: "hour" | "minute" | "second" | "meridiem";
    label?: string;
    class?: string;
    selected?: number;
  } = {},
) {
  const fake = createFakeTimePickerContext({
    units: ["hour", "minute"],
    options: smallOptions(),
    getUnitLabel: (unit) => (unit === "hour" ? "Hour" : "Minute"),
  });
  if (options.selected !== undefined) {
    fake.setSelected(options.unit ?? "hour", options.selected);
  }

  const view = render(() => (
    <TimePickerContext.Provider value={fake.ctx}>
      <TimePickerColumn
        unit={options.unit ?? "hour"}
        label={options.label}
        class={options.class}
      />
    </TimePickerContext.Provider>
  ));

  return { fake, ...view };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("TimePickerColumn - 渲染与 ARIA", () => {
  it("外层标记 data-slot/data-unit，内层是 tabindex=0 的 role=listbox", () => {
    const { container } = renderColumn();

    const column = container.querySelector(
      '[data-slot="time-picker-column"]',
    ) as HTMLElement;
    const list = screen.getByRole("listbox");

    expect(column).toHaveAttribute("data-unit", "hour");
    expect(column.contains(list)).toBe(true);
    expect(list).toHaveAttribute("tabindex", "0");
    expect(
      container.querySelector('[data-slot="time-picker-columns"]'),
    ).toBeNull();
  });

  it("未传 label 时用 ctx.getUnitLabel 作为 aria-label", () => {
    renderColumn({ unit: "minute" });

    expect(screen.getByRole("listbox")).toHaveAttribute("aria-label", "Minute");
  });

  it("传了 label 时覆盖单位名称", () => {
    renderColumn({ label: "小时" });

    expect(screen.getByRole("listbox")).toHaveAttribute("aria-label", "小时");
  });

  it("按选项渲染 role=option，并把选中值标为 aria-selected", () => {
    renderColumn({ selected: 1 });

    const options = within(screen.getByRole("listbox")).getAllByRole("option");

    expect(options.map((o) => o.textContent)).toEqual(["00", "01", "02"]);
    expect(options[0]).toHaveAttribute("aria-selected", "false");
    expect(options[1]).toHaveAttribute("aria-selected", "true");
    expect(options[1]).toHaveAttribute("data-selected", "true");
  });

  it("aria-activedescendant 指向选中项", () => {
    renderColumn({ selected: 2 });

    const list = screen.getByRole("listbox");
    const selected = within(list).getByRole("option", { name: "02" });

    expect(list).toHaveAttribute("aria-activedescendant", selected.id);
    expect(selected.id).not.toBe("");
  });

  it("自定义 class 与列的基础 class 合并", () => {
    const { container } = renderColumn({ class: "my-column" });

    const column = container.querySelector(
      '[data-slot="time-picker-column"]',
    ) as HTMLElement;

    expect(column).toHaveClass("my-column");
    expect(column).toHaveClass("relative");
  });
});

describe("TimePickerColumn - 点击选项", () => {
  it("点击选项以 option-press 提交该值，trigger 是选项本身", () => {
    const { fake } = renderColumn();

    const option = within(screen.getByRole("listbox")).getByRole("option", {
      name: "02",
    });
    fireEvent.click(option);

    expect(fake.commits).toHaveLength(1);
    expect(fake.commits[0]!.unit).toBe("hour");
    expect(fake.commits[0]!.value).toBe(2);
    expect(fake.commits[0]!.options?.reason).toBe("option-press");
    expect(fake.commits[0]!.options?.trigger).toBe(option);
  });

  it("点击已选中项仍提交（值不变）", () => {
    const { fake } = renderColumn({ selected: 1 });

    const option = within(screen.getByRole("listbox")).getByRole("option", {
      name: "01",
    });
    fireEvent.click(option);

    expect(fake.commits).toHaveLength(1);
    expect(fake.commits[0]!.value).toBe(1);
  });
});
