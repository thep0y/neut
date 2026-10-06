import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { FieldContent } from "~/components/field/FieldContent/FieldContent";

/** FieldContent：`data-slot="field-content"` 的 div 包装层，样式 + 属性透传。 */
describe("FieldContent", () => {
  it("渲染 div 并带 data-slot=field-content", () => {
    const { container } = render(() => <FieldContent />);
    const element = container.querySelector('[data-slot="field-content"]');

    expect(element?.tagName).toBe("DIV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <FieldContent class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="field-content"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <FieldContent id="x" aria-label="标签">
        <span data-testid="child">内容</span>
      </FieldContent>
    ));
    const element = container.querySelector('[data-slot="field-content"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("标签");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
