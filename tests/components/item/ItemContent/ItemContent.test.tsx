import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ItemContent } from "~/components/item/ItemContent/ItemContent";

/** ItemContent：`data-slot="item-content"` 的 div 包装层。 */
describe("ItemContent", () => {
  it("渲染 div 并带 data-slot=item-content", () => {
    const { container } = render(() => <ItemContent />);
    const element = container.querySelector('[data-slot="item-content"]');

    expect(element?.tagName).toBe("DIV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <ItemContent class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="item-content"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <ItemContent id="x" aria-label="标签">
        <span data-testid="child">内容</span>
      </ItemContent>
    ));
    const element = container.querySelector('[data-slot="item-content"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("标签");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
