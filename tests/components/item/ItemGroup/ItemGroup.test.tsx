import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ItemGroup } from "~/components/item/ItemGroup/ItemGroup";

/** ItemGroup：`data-slot="item-group"` 的 div 包装层。 */
describe("ItemGroup", () => {
  it("渲染 div 并带 data-slot=item-group", () => {
    const { container } = render(() => <ItemGroup />);
    const element = container.querySelector('[data-slot="item-group"]');

    expect(element?.tagName).toBe("DIV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <ItemGroup class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="item-group"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <ItemGroup id="x" aria-label="标签">
        <span data-testid="child">内容</span>
      </ItemGroup>
    ));
    const element = container.querySelector('[data-slot="item-group"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("标签");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
