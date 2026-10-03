import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ItemDescription } from "~/components/item/ItemDescription/ItemDescription";

/** ItemDescription：`data-slot="item-description"` 的 p 包装层。 */
describe("ItemDescription", () => {
  it("渲染 p 并带 data-slot=item-description", () => {
    const { container } = render(() => <ItemDescription />);
    const element = container.querySelector('[data-slot="item-description"]');

    expect(element?.tagName).toBe("P");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <ItemDescription class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="item-description"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <ItemDescription id="x" aria-label="标签">
        <span data-testid="child">内容</span>
      </ItemDescription>
    ));
    const element = container.querySelector('[data-slot="item-description"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("标签");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
