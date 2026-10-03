import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { Accordion } from "~/components/accordion/Accordion/Accordion";
import { AccordionContent } from "~/components/accordion/AccordionContent/AccordionContent";
import { AccordionItem } from "~/components/accordion/AccordionItem/AccordionItem";
import { AccordionTrigger } from "~/components/accordion/AccordionTrigger/AccordionTrigger";

/**
 * AccordionContent：关闭时**卸载**（`Show`），展开后测量真实高度写入
 * `--accordion-panel-height`，并在收起动画结束后把挂载态复位。
 */
function renderContent(
  itemProps: Parameters<typeof AccordionItem>[0] = { value: "a" },
  rootProps: Parameters<typeof Accordion>[0] = {},
) {
  const view = render(() => (
    <Accordion {...rootProps}>
      <AccordionItem {...itemProps}>
        <AccordionTrigger>标题</AccordionTrigger>
        <AccordionContent class="my-content" classList={{ "is-open": true }}>
          <p data-testid="body">内容</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ));
  const panel = () =>
    view.container.querySelector<HTMLElement>(
      '[data-slot="accordion-content"]',
    );
  return { ...view, panel };
}

/** 模拟收起动画结束事件 */
function endCollapseAnimation(element: HTMLElement) {
  const event = new Event("animationend", { bubbles: true });
  Object.defineProperty(event, "animationName", { value: "accordion-up" });
  fireEvent(element, event);
}

describe("AccordionContent - 挂载与卸载", () => {
  it("初始关闭时不渲染内容", () => {
    const { panel } = renderContent();

    expect(panel()).toBeNull();
  });

  it("defaultValue 打开时渲染，并带上 ARIA 关联与状态", () => {
    const { panel } = renderContent({ value: "a" }, { defaultValue: ["a"] });
    const element = panel()!;

    expect(element).not.toBeNull();
    expect(element.getAttribute("role")).toBe("region");
    expect(element.getAttribute("aria-labelledby")).toMatch(
      /^accordion-trigger-/,
    );
    expect(element.id).toMatch(/^accordion-content-/);
    expect(element.getAttribute("data-open")).toBe("true");
    expect(element.getAttribute("data-orientation")).toBe("vertical");
  });

  it("展开后渲染内容，收起动画结束后再卸载", () => {
    const { panel, container } = renderContent();
    const trigger = container.querySelector<HTMLButtonElement>(
      "[data-accordion-trigger]",
    )!;

    fireEvent.click(trigger);
    expect(panel()).not.toBeNull();
    expect(panel()?.getAttribute("data-open")).toBe("true");

    fireEvent.click(trigger);
    // 收起时 data-open 已是 false，但仍挂在 DOM 上等待动画
    expect(panel()?.getAttribute("data-open")).toBe("false");

    endCollapseAnimation(panel()!);
    expect(panel()).toBeNull();
  });

  it("动画名不匹配时保持挂载（只认 accordion-up）", () => {
    const { panel, container } = renderContent();
    const trigger = container.querySelector<HTMLButtonElement>(
      "[data-accordion-trigger]",
    )!;
    fireEvent.click(trigger);
    fireEvent.click(trigger);

    const event = new Event("animationend", { bubbles: true });
    Object.defineProperty(event, "animationName", { value: "fade-out" });
    fireEvent(panel()!, event);

    expect(panel()).not.toBeNull();
  });

  it("重新打开时不重新测量高度（沿用已测量值）", () => {
    const { panel, container } = renderContent();
    const trigger = container.querySelector<HTMLButtonElement>(
      "[data-accordion-trigger]",
    )!;

    fireEvent.click(trigger);
    const first = panel()!.style.getPropertyValue("--accordion-panel-height");
    fireEvent.click(trigger);
    endCollapseAnimation(panel()!);
    fireEvent.click(trigger);

    expect(
      panel()!.style.getPropertyValue("--accordion-panel-height"),
    ).not.toBe("");
    expect(first).toBe(
      panel()!.style.getPropertyValue("--accordion-panel-height"),
    );
  });
});

describe("AccordionContent - 高度与样式", () => {
  it("挂载后写入测量到的高度变量（jsdom 为 0px）", () => {
    const { panel } = renderContent({ value: "a" }, { defaultValue: ["a"] });

    expect(panel()!.style.getPropertyValue("--accordion-panel-height")).toBe(
      "0px",
    );
  });

  it("内容包装层承载 class 与 classList，面板本身用固定样式", () => {
    const { panel } = renderContent({ value: "a" }, { defaultValue: ["a"] });
    const wrapper = panel()!.firstElementChild as HTMLElement;

    expect(wrapper.className).toContain("my-content");
    expect(wrapper.className).toContain("is-open");
    expect(panel()!.className).not.toContain("my-content");
  });

  it("透传其余属性到面板（id / data-* / aria-*），并渲染 children", () => {
    const view = render(() => (
      <Accordion defaultValue={["a"]}>
        <AccordionItem value="a">
          <AccordionTrigger>标题</AccordionTrigger>
          <AccordionContent id="panel-a" data-custom="yes">
            <span data-testid="inner">正文</span>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    ));
    const panel = view.container.querySelector<HTMLElement>(
      '[data-slot="accordion-content"]',
    )!;

    expect(panel.id).toBe("panel-a");
    expect(panel.getAttribute("data-custom")).toBe("yes");
    expect(view.getByTestId("inner")).toBeInTheDocument();
  });

  it("受控模式：外部把值清空后收起，动画结束后卸载", () => {
    const [value, setValue] = createSignal<string[]>(["a"]);
    const view = render(() => (
      <Accordion value={value()}>
        <AccordionItem value="a">
          <AccordionTrigger>标题</AccordionTrigger>
          <AccordionContent>
            <span data-testid="inner">正文</span>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    ));
    const panel = () =>
      view.container.querySelector<HTMLElement>(
        '[data-slot="accordion-content"]',
      );

    expect(panel()).not.toBeNull();

    setValue([]);
    expect(panel()?.getAttribute("data-open")).toBe("false");

    endCollapseAnimation(panel()!);
    expect(panel()).toBeNull();
  });
});
