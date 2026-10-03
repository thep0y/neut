import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ItemFooter } from "~/components/item/ItemFooter/ItemFooter";

/** ItemFooter：`data-slot="item-footer"` 的 div 包装层。 */
describe("ItemFooter", () => {
  it("渲染 div 并带 data-slot=item-footer", () => {
    const { container } = render(() => <ItemFooter />);
    const element = container.querySelector('[data-slot="item-footer"]');

    expect(element?.tagName).toBe("DIV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <ItemFooter class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="item-footer"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <ItemFooter id="x" aria-label="标签">
        <span data-testid="child">内容</span>
      </ItemFooter>
    ));
    const element = container.querySelector('[data-slot="item-footer"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("标签");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
