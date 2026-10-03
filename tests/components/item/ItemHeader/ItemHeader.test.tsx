import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ItemHeader } from "~/components/item/ItemHeader/ItemHeader";

/** ItemHeader：`data-slot="item-header"` 的 div 包装层。 */
describe("ItemHeader", () => {
  it("渲染 div 并带 data-slot=item-header", () => {
    const { container } = render(() => <ItemHeader />);
    const element = container.querySelector('[data-slot="item-header"]');

    expect(element?.tagName).toBe("DIV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <ItemHeader class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="item-header"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <ItemHeader id="x" aria-label="标签">
        <span data-testid="child">内容</span>
      </ItemHeader>
    ));
    const element = container.querySelector('[data-slot="item-header"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("标签");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
