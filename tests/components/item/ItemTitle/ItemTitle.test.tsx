import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ItemTitle } from "~/components/item/ItemTitle/ItemTitle";

/** ItemTitle：`data-slot="item-title"` 的 div 包装层。 */
describe("ItemTitle", () => {
  it("渲染 div 并带 data-slot=item-title", () => {
    const { container } = render(() => <ItemTitle />);
    const element = container.querySelector('[data-slot="item-title"]');

    expect(element?.tagName).toBe("DIV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <ItemTitle class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="item-title"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <ItemTitle id="x" aria-label="标签">
        <span data-testid="child">内容</span>
      </ItemTitle>
    ));
    const element = container.querySelector('[data-slot="item-title"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("标签");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
