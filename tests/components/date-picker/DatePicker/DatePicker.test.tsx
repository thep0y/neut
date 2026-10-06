import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { DatePicker } from "~/components/date-picker/DatePicker/DatePicker";

/**
 * DatePicker 的渲染与展示文本：底层是 Popover + Calendar 的组合，
 * 这里只验证 trigger 上的文本、`data-empty` 与属性透传；
 * 打开浮层、点选日期等组合行为在 `date-picker.integration.test.tsx`。
 *
 * 固定 `defaultValue` / `value` 与 `locale="en-US"`，让 Intl 输出可预测。
 */
const APRIL_29_2025 = new Date(2025, 3, 29);

function triggerOf(container: HTMLElement): HTMLButtonElement {
  return container.querySelector(
    '[data-slot="popover-trigger"]',
  ) as HTMLButtonElement;
}

describe("DatePicker - 展示文本", () => {
  it("未选日期时显示默认 placeholder，并带 data-empty", () => {
    const { container } = render(() => <DatePicker />);
    const trigger = triggerOf(container);

    expect(trigger.textContent).toContain("Pick a date");
    expect(trigger.getAttribute("data-empty")).toBe("true");
  });

  it("placeholder 可覆盖", () => {
    const { container } = render(() => <DatePicker placeholder="选择日期" />);

    expect(triggerOf(container).textContent).toContain("选择日期");
  });

  it("defaultValue 用默认 Intl 格式显示长日期，data-empty 被清除", () => {
    const { container } = render(() => (
      <DatePicker defaultValue={APRIL_29_2025} locale="en-US" />
    ));
    const trigger = triggerOf(container);

    expect(trigger.textContent).toContain("April 29, 2025");
    expect(trigger.hasAttribute("data-empty")).toBe(false);
  });

  it("受控 value 直接决定展示文本", () => {
    const { container } = render(() => (
      <DatePicker value={APRIL_29_2025} locale="en-US" />
    ));

    expect(triggerOf(container).textContent).toContain("April 29, 2025");
  });

  it("locale 传字符串或 { code } 都用于格式化", () => {
    const asString = render(() => (
      <DatePicker defaultValue={APRIL_29_2025} locale="en-US" />
    ));
    const asObject = render(() => (
      <DatePicker defaultValue={APRIL_29_2025} locale={{ code: "en-US" }} />
    ));

    expect(triggerOf(asString.container).textContent).toContain(
      "April 29, 2025",
    );
    expect(triggerOf(asObject.container).textContent).toContain(
      "April 29, 2025",
    );
  });

  it("不传 locale 时回退到运行环境默认区域", () => {
    const { container } = render(() => (
      <DatePicker defaultValue={APRIL_29_2025} />
    ));
    const text = triggerOf(container).textContent ?? "";

    expect(text).not.toContain("Pick a date");
    expect(text).toContain("2025");
  });

  it("自定义 formatDate 覆盖默认格式，并收到日期与 locale code", () => {
    const formatDate = vi.fn(() => "二〇二五年四月二十九日");
    const { container } = render(() => (
      <DatePicker
        defaultValue={APRIL_29_2025}
        locale="en-US"
        formatDate={formatDate}
      />
    ));

    expect(triggerOf(container).textContent).toContain(
      "二〇二五年四月二十九日",
    );
    expect(formatDate).toHaveBeenCalledWith(APRIL_29_2025, "en-US");
  });
});

describe("DatePicker - trigger 属性", () => {
  it("合并 class 与 classList", () => {
    const { container } = render(() => (
      <DatePicker class="my-picker" classList={{ "is-wide": true }} />
    ));
    const trigger = triggerOf(container);

    expect(trigger.className).toContain("my-picker");
    expect(trigger.className).toContain("is-wide");
  });

  it("disabled 透传到 trigger", () => {
    const { container } = render(() => <DatePicker disabled />);

    expect(triggerOf(container).disabled).toBe(true);
  });
});

describe("DatePicker - style 透传（回归）", () => {
  it("style 是公开 prop，会落到 trigger 上而不是被静默丢弃", () => {
    // 此前 "style" 被 splitProps 摘出来却从未应用，整棵树都没有该内联样式
    const { container } = render(() => <DatePicker style={{ color: "red" }} />);
    const trigger = container.querySelector(
      '[data-slot="popover-trigger"]',
    ) as HTMLElement;

    expect(trigger.style.color).toBe("red");
  });

  it("style 与内置样式共存（不是整体替换）", () => {
    const { container } = render(() => (
      <DatePicker style={{ color: "blue" }} />
    ));
    const trigger = container.querySelector(
      '[data-slot="popover-trigger"]',
    ) as HTMLElement;

    expect(trigger.style.color).toBe("blue");
    expect(trigger.className).toContain("w-53");
  });
});
