import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import { Accordion } from "~/components/accordion/Accordion/Accordion";
import { AccordionTrigger } from "~/components/accordion/AccordionTrigger/AccordionTrigger";
import { AccordionItem } from "~/components/accordion/AccordionItem/AccordionItem";

/**
 * AccordionTrigger：`h3 > button`（标题语义 + 按钮交互）。
 * 按钮上同时带 aria-controls/aria-expanded/data-open 等状态。
 */
function renderTrigger(
  itemProps: Parameters<typeof AccordionItem>[0] = { value: "a" },
  rootProps: Parameters<typeof Accordion>[0] = {},
) {
  const view = render(() => (
    <Accordion {...rootProps}>
      <AccordionItem {...itemProps}>
        <AccordionTrigger>标题</AccordionTrigger>
      </AccordionItem>
    </Accordion>
  ));
  const button = () =>
    view.container.querySelector<HTMLButtonElement>(
      "[data-accordion-trigger]",
    )!;
  const heading = () => button().closest("h3")!;
  return { ...view, button, heading };
}

describe("AccordionTrigger - 结构与 ARIA", () => {
  it("渲染 h3 内的 button，按钮可被 data 属性与 aria 定位", () => {
    const { button, heading } = renderTrigger();

    expect(heading()).not.toBeNull();
    expect(button().tagName).toBe("BUTTON");
    expect(button().type).toBe("button");
    expect(button().hasAttribute("data-accordion-trigger")).toBe(true);
    expect(button().getAttribute("data-orientation")).toBe("vertical");
    expect(button().textContent).toContain("标题");
  });

  it("aria-expanded 与 data-open 跟随打开状态", () => {
    const closed = renderTrigger();
    expect(closed.button().getAttribute("aria-expanded")).toBe("false");
    expect(closed.button().getAttribute("data-open")).toBe("false");

    const opened = renderTrigger({ value: "a" }, { defaultValue: ["a"] });
    expect(opened.button().getAttribute("aria-expanded")).toBe("true");
    expect(opened.button().getAttribute("data-open")).toBe("true");
  });

  it("aria-controls 指向内容区的 id且与 h3 上的 data 属性一致", () => {
    const { button, heading, container } = renderTrigger();

    expect(button().id).toMatch(/^accordion-trigger-/);
    expect(button().getAttribute("aria-controls")).toMatch(
      /^accordion-content-/,
    );
    expect(heading().getAttribute("data-open")).toBe("false");
    expect(
      container.querySelector('[data-slot="accordion-trigger-icon"]'),
    ).not.toBeNull();
  });

  it("禁用时按钮 disabled、aria-disabled 为 true、h3 带 data-disabled", () => {
    const { button, heading } = renderTrigger({ value: "a", disabled: true });

    expect(button().disabled).toBe(true);
    expect(button().getAttribute("aria-disabled")).toBe("true");
    expect(heading().hasAttribute("data-disabled")).toBe(true);
  });
});

describe("AccordionTrigger - 交互", () => {
  it("点击展开，再点击收起（非受控）", () => {
    const { button } = renderTrigger();

    fireEvent.click(button());
    expect(button().getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(button());
    expect(button().getAttribute("aria-expanded")).toBe("false");
  });

  it("onValueChange 收到打开/关闭后的值数组", () => {
    const onValueChange = vi.fn();
    const { button } = renderTrigger({ value: "a" }, { onValueChange });

    fireEvent.click(button());
    expect(onValueChange).toHaveBeenLastCalledWith(["a"]);

    fireEvent.click(button());
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  /** rest 属性透传到 h3，真正的按钮在它内部 */
  const buttonIn = (element: HTMLElement) =>
    element.querySelector("button") as HTMLButtonElement;

  it("single 模式：打开另一项会关掉前一项", () => {
    const view = render(() => (
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger data-testid="t-a">A</AccordionTrigger>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger data-testid="t-b">B</AccordionTrigger>
        </AccordionItem>
      </Accordion>
    ));
    const a = buttonIn(view.getByTestId("t-a"));
    const b = buttonIn(view.getByTestId("t-b"));

    fireEvent.click(a);
    expect(a.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(b);
    expect(b.getAttribute("aria-expanded")).toBe("true");
    expect(a.getAttribute("aria-expanded")).toBe("false");
  });

  it("multiple 模式：可以同时打开多项", () => {
    const view = render(() => (
      <Accordion multiple>
        <AccordionItem value="a">
          <AccordionTrigger data-testid="t-a">A</AccordionTrigger>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger data-testid="t-b">B</AccordionTrigger>
        </AccordionItem>
      </Accordion>
    ));
    const a = buttonIn(view.getByTestId("t-a"));
    const b = buttonIn(view.getByTestId("t-b"));

    fireEvent.click(a);
    fireEvent.click(b);

    expect(a.getAttribute("aria-expanded")).toBe("true");
    expect(b.getAttribute("aria-expanded")).toBe("true");
  });

  it("禁用的 item：点击不改变状态", () => {
    const onValueChange = vi.fn();
    const { button } = renderTrigger(
      { value: "a", disabled: true },
      { onValueChange },
    );

    // disabled 按钮不触发原生 click 默认行为，但监听器仍会收到事件
    fireEvent.click(button());

    expect(onValueChange).not.toHaveBeenCalled();
    expect(button().getAttribute("aria-expanded")).toBe("false");
  });

  it("受控模式：只通知外部，自身状态由 value 决定", () => {
    const onValueChange = vi.fn();
    const { button } = renderTrigger(
      { value: "a" },
      {
        value: ["a"],
        onValueChange,
      },
    );

    fireEvent.click(button());

    expect(onValueChange).toHaveBeenLastCalledWith([]);
    expect(button().getAttribute("aria-expanded")).toBe("true");
  });

  it("受控 + multiple：把新值追加到已有数组", () => {
    const onValueChange = vi.fn();
    const view = render(() => (
      <Accordion multiple value={["a"]} onValueChange={onValueChange}>
        <AccordionItem value="a">
          <AccordionTrigger data-testid="t-a">A</AccordionTrigger>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger data-testid="t-b">B</AccordionTrigger>
        </AccordionItem>
      </Accordion>
    ));

    fireEvent.click(buttonIn(view.getByTestId("t-b")));

    expect(onValueChange).toHaveBeenLastCalledWith(["a", "b"]);
  });

  it("受控 + 单选：打开新值时只保留新值", () => {
    const onValueChange = vi.fn();
    const view = render(() => (
      <Accordion value={["a"]} onValueChange={onValueChange}>
        <AccordionItem value="a">
          <AccordionTrigger data-testid="t-a">A</AccordionTrigger>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger data-testid="t-b">B</AccordionTrigger>
        </AccordionItem>
      </Accordion>
    ));

    fireEvent.click(buttonIn(view.getByTestId("t-b")));

    expect(onValueChange).toHaveBeenLastCalledWith(["b"]);
  });

  it("multiple 非受控：再次点击已展开项会收起它", () => {
    const view = render(() => (
      <Accordion multiple>
        <AccordionItem value="a">
          <AccordionTrigger data-testid="t-a">A</AccordionTrigger>
        </AccordionItem>
      </Accordion>
    ));
    const a = buttonIn(view.getByTestId("t-a"));

    fireEvent.click(a);
    expect(a.getAttribute("aria-expanded")).toBe("true");

    fireEvent.click(a);
    expect(a.getAttribute("aria-expanded")).toBe("false");
  });

  it("传入自定义 children 与类名", () => {
    const { button } = renderTrigger();
    expect(button().textContent).toContain("标题");

    const view = render(() => (
      <Accordion>
        <AccordionItem value="a">
          <AccordionTrigger
            class="my-trigger"
            classList={{ "is-bold": true }}
            id="trig"
          >
            <span data-testid="custom">自定义</span>
          </AccordionTrigger>
        </AccordionItem>
      </Accordion>
    ));
    const custom = view.container.querySelector<HTMLButtonElement>(
      "[data-accordion-trigger]",
    )!;

    expect(custom.className).toContain("my-trigger");
    expect(custom.className).toContain("is-bold");
    // id 等其余属性透传到 h3（标题元素），按钮保留生成的 id
    expect(view.container.querySelector("h3")?.id).toBe("trig");
    expect(custom.id).toMatch(/^accordion-trigger-/);
    expect(view.getByTestId("custom")).toBeInTheDocument();
  });

  it("受控 value 变化时状态跟着变", () => {
    const [value, setValue] = createSignal<("a" | "b")[]>(["a"]);
    const view = render(() => (
      <Accordion value={value()}>
        <AccordionItem value="a">
          <AccordionTrigger data-testid="t-a">A</AccordionTrigger>
        </AccordionItem>
      </Accordion>
    ));
    const a = buttonIn(view.getByTestId("t-a"));

    expect(a.getAttribute("aria-expanded")).toBe("true");

    setValue([]);
    expect(a.getAttribute("aria-expanded")).toBe("false");
  });
});
