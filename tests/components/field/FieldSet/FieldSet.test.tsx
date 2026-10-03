import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { FieldSet } from "~/components/field/FieldSet/FieldSet";

/** FieldSet：`data-slot="field-set"` 的 fieldset 包装层，样式 + 属性透传。 */
describe("FieldSet", () => {
  it("渲染 fieldset 并带 data-slot=field-set", () => {
    const { container } = render(() => <FieldSet />);
    const element = container.querySelector('[data-slot="field-set"]');

    expect(element?.tagName).toBe("FIELDSET");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <FieldSet class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="field-set"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <FieldSet id="x" aria-label="标签">
        <span data-testid="child">内容</span>
      </FieldSet>
    ));
    const element = container.querySelector('[data-slot="field-set"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("标签");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
