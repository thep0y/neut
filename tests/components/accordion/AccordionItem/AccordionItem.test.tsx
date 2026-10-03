import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { Accordion } from "~/components/accordion/Accordion/Accordion";
import { AccordionItem } from "~/components/accordion/AccordionItem/AccordionItem";
import { useAccordionItemContext } from "~/components/accordion/AccordionItem/AccordionItem.context";

/** 读回 item context 的探针 */
function ItemProbe() {
  const ctx = useAccordionItemContext();
  return (
    <div>
      <span data-testid="value">{String(ctx.value)}</span>
      <span data-testid="open">{String(ctx.open())}</span>
      <span data-testid="trigger-id">{ctx.triggerId}</span>
      <span data-testid="content-id">{ctx.contentId}</span>
      <span data-testid="disabled">{String(ctx.disabled ?? false)}</span>
    </div>
  );
}

function itemOf(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-slot="accordion-item"]');
}

describe("AccordionItem - 结构与状态", () => {
  it("渲染 data-slot=accordion-item，并带上方向与打开状态", () => {
    const { container } = render(() => (
      <Accordion defaultValue={["a"]}>
        <AccordionItem value="a" />
        <AccordionItem value="b" />
      </Accordion>
    ));

    const items = container.querySelectorAll('[data-slot="accordion-item"]');
    expect(items).toHaveLength(2);
    expect(items[0]?.getAttribute("data-orientation")).toBe("vertical");
    expect(items[0]?.getAttribute("data-open")).toBe("true");
    expect(items[1]?.getAttribute("data-open")).toBe("false");
  });

  it("disabled 映射成 data-disabled，未禁用时属性缺失", () => {
    const { container } = render(() => (
      <Accordion>
        <AccordionItem value="a" disabled />
        <AccordionItem value="b" />
      </Accordion>
    ));

    const items = container.querySelectorAll('[data-slot="accordion-item"]');
    expect(items[0]?.hasAttribute("data-disabled")).toBe(true);
    expect(items[1]?.hasAttribute("data-disabled")).toBe(false);
  });

  it("合并类名/classList 并透传其余属性", () => {
    const { container } = render(() => (
      <Accordion>
        <AccordionItem
          value="a"
          class="my-item"
          classList={{ "is-open": true }}
          id="item-a"
        />
      </Accordion>
    ));
    const item = itemOf(container)!;

    expect(item.className).toContain("my-item");
    expect(item.className).toContain("is-open");
    expect(item.id).toBe("item-a");
  });
});

describe("AccordionItem - context", () => {
  it("value 缺省时回退到自动生成的唯一 id", () => {
    const { getAllByTestId } = render(() => (
      <Accordion>
        <AccordionItem>
          <ItemProbe />
        </AccordionItem>
        <AccordionItem>
          <ItemProbe />
        </AccordionItem>
      </Accordion>
    ));

    const values = getAllByTestId("value").map((el) => el.textContent);
    expect(values[0]).not.toBe("");
    expect(values[1]).not.toBe("");
    expect(values[0]).not.toBe(values[1]);
  });

  it("triggerId / contentId 成对且由同一唯一 id 派生", () => {
    const { getByTestId } = render(() => (
      <Accordion>
        <AccordionItem value="a">
          <ItemProbe />
        </AccordionItem>
      </Accordion>
    ));

    const triggerId = getByTestId("trigger-id").textContent!;
    const contentId = getByTestId("content-id").textContent!;

    expect(triggerId).toMatch(/^accordion-trigger-/);
    expect(contentId).toMatch(/^accordion-content-/);
    expect(triggerId.replace("trigger", "")).toBe(
      contentId.replace("content", ""),
    );
  });

  it("open 跟随根组件的选中值，disabled 传下去", () => {
    const { getByTestId } = render(() => (
      <Accordion value={["a"]}>
        <AccordionItem value="a" disabled>
          <ItemProbe />
        </AccordionItem>
      </Accordion>
    ));

    expect(getByTestId("open").textContent).toBe("true");
    expect(getByTestId("disabled").textContent).toBe("true");
  });

  it("value 显式传值时用显式值（不是生成的 id）", () => {
    const { getByTestId } = render(() => (
      <Accordion>
        <AccordionItem value="explicit">
          <ItemProbe />
        </AccordionItem>
      </Accordion>
    ));

    expect(getByTestId("value").textContent).toBe("explicit");
  });
});

describe("AccordionItem - 缺少 Provider", () => {
  it("脱离 Accordion / AccordionItem 使用时抛中文错误", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(() => <ItemProbe />)).toThrow(
      /useAccordionItemContext must be used in AccordionProvider/,
    );
    expect(() =>
      render(() => (
        <Accordion>
          <AccordionItem value="a" />
        </Accordion>
      )),
    ).not.toThrow();

    error.mockRestore();
  });

  it("AccordionItem 脱离 Accordion 时抛错", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(() => <AccordionItem value="a" />)).toThrow(
      /useAccordionContext must be used in AccordionProvider/,
    );

    error.mockRestore();
  });
});
