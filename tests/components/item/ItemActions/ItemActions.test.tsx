import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ItemActions } from "~/components/item/ItemActions/ItemActions";

/** ItemActions：`data-slot="item-actions"` 的 p 包装层。 */
describe("ItemActions", () => {
  it("渲染 p 并带 data-slot=item-actions", () => {
    const { container } = render(() => <ItemActions />);
    const element = container.querySelector('[data-slot="item-actions"]');

    expect(element?.tagName).toBe("P");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <ItemActions class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="item-actions"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <ItemActions id="x" aria-label="标签">
        <span data-testid="child">内容</span>
      </ItemActions>
    ));
    const element = container.querySelector('[data-slot="item-actions"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("标签");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
