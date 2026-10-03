import { render, screen } from "@solidjs/testing-library";
import type { JSX } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Popover } from "~/components/popover/Popover/Popover";
import { TimePickerContext } from "~/components/time-picker/TimePicker/TimePicker.context";
import { TimePickerContent } from "~/components/time-picker/TimePickerContent/TimePickerContent";
import {
  createFakeTimePickerContext,
  type FakeTimePickerContextOptions,
  smallOptions,
} from "~tests/components/time-picker/test-utils";

/**
 * `TimePickerContent` 复用 PopoverContent 的定位/动画/外点关闭，自己只负责
 * 按 `ctx.units()` 渲染列、把 `dir` 传给列容器，并在打开时把焦点移入第一列。
 */

type ContentOptions = Partial<FakeTimePickerContextOptions> & {
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  class?: string;
  children?: JSX.Element;
};

function renderContent(options: ContentOptions = {}) {
  const fake = createFakeTimePickerContext({
    units: options.units ?? ["hour", "minute"],
    options: options.options ?? smallOptions(),
    dir: options.dir,
    getUnitLabel: (unit) => unit,
  });

  const view = render(() => (
    <Popover defaultOpen>
      <TimePickerContext.Provider value={fake.ctx}>
        <TimePickerContent
          side={options.side}
          align={options.align}
          class={options.class}
        >
          {options.children}
        </TimePickerContent>
      </TimePickerContext.Provider>
    </Popover>
  ));

  return { fake, ...view };
}

const columnsContainer = (): HTMLElement =>
  document.querySelector('[data-slot="time-picker-columns"]') as HTMLElement;
const content = (): HTMLElement =>
  document.querySelector('[data-slot="popover-content"]') as HTMLElement;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("TimePickerContent - 列渲染", () => {
  it("按 ctx.units() 渲染每一列，外层容器带 data-slot", () => {
    renderContent();

    const columns = document.querySelectorAll(
      '[data-slot="time-picker-column"]',
    );

    expect(columns).toHaveLength(2);
    expect(Array.from(columns).map((c) => c.getAttribute("data-unit"))).toEqual(
      ["hour", "minute"],
    );
    expect(screen.getAllByRole("listbox")).toHaveLength(2);
    expect(columnsContainer()).toHaveAttribute(
      "data-slot",
      "time-picker-columns",
    );
  });

  it("hourCycle=12 时额外渲染 meridiem 列", () => {
    renderContent({
      units: ["hour", "minute", "meridiem"],
      options: {
        ...smallOptions(),
        meridiem: [
          { value: "AM", label: "AM" },
          { value: "PM", label: "PM" },
        ],
      },
    });

    expect(screen.getAllByRole("listbox")).toHaveLength(3);
  });

  it("dir 来自 ctx", () => {
    renderContent({ dir: "rtl" });

    expect(columnsContainer()).toHaveAttribute("dir", "rtl");
  });

  it("ctx.dir 为空时列容器不带 dir 属性", () => {
    renderContent();

    expect(columnsContainer()).not.toHaveAttribute("dir");
  });

  it("传入 children 时不再渲染默认列", () => {
    renderContent({
      children: <div data-testid="custom-columns">自定义</div>,
    });

    expect(screen.queryAllByRole("listbox")).toHaveLength(0);
    expect(
      columnsContainer().contains(screen.getByTestId("custom-columns")),
    ).toBe(true);
  });
});

describe("TimePickerContent - 定位参数", () => {
  it("默认 align=start", () => {
    renderContent();

    expect(content()).toHaveAttribute("data-align", "start");
  });

  it("显式 align=end 覆盖默认值", () => {
    renderContent({ align: "end" });

    expect(content()).toHaveAttribute("data-align", "end");
  });

  it("side 缺省与显式传值都产出合法的物理方向", () => {
    const explicit = renderContent({ side: "top" });
    expect(["top", "bottom", "left", "right"]).toContain(
      content().getAttribute("data-side"),
    );
    explicit.unmount();

    renderContent();
    expect(["top", "bottom", "left", "right"]).toContain(
      content().getAttribute("data-side"),
    );
  });

  it("自定义 class 与浮层基础 class 合并", () => {
    renderContent({ class: "my-content" });

    expect(content()).toHaveClass("my-content");
  });
});

describe("TimePickerContent - 打开时聚焦第一列", () => {
  it("下一帧把焦点移入第一列并同步 activeUnit", async () => {
    const { fake } = renderContent();

    await vi.advanceTimersByTimeAsync(16);

    expect(fake.ctx.activeUnit()).toBe("hour");
    expect(document.activeElement).toBe(screen.getAllByRole("listbox")[0]);
  });

  it("没有任何列时（units 为空）不聚焦、不报错", async () => {
    const { fake } = renderContent({ units: [] });

    await vi.advanceTimersByTimeAsync(16);

    expect(fake.ctx.activeUnit()).toBeUndefined();
    expect(screen.queryAllByRole("listbox")).toHaveLength(0);
  });

  it("自定义 children 未注册列元素时 focus 走可选链兜底", async () => {
    const { fake } = renderContent({
      units: ["hour"],
      children: <div data-testid="custom-columns">自定义</div>,
    });

    await vi.advanceTimersByTimeAsync(16);

    expect(fake.ctx.activeUnit()).toBe("hour");
    expect(document.activeElement).not.toBe(columnsContainer());
  });
});
