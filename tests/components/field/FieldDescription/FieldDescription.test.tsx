import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { FieldDescription } from "~/components/field/FieldDescription/FieldDescription";

/** FieldDescription：`data-slot="field-description"` 的 p 包装层，样式 + 属性透传。 */
describe("FieldDescription", () => {
  it("渲染 p 并带 data-slot=field-description", () => {
    const { container } = render(() => <FieldDescription />);
    const element = container.querySelector('[data-slot="field-description"]');

    expect(element?.tagName).toBe("P");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <FieldDescription class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="field-description"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <FieldDescription id="x" aria-label="标签">
        <span data-testid="child">内容</span>
      </FieldDescription>
    ));
    const element = container.querySelector('[data-slot="field-description"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("标签");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
