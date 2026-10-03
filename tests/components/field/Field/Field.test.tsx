import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Field } from "~/components/field/Field/Field";

/** Field：`data-slot="field"` 的 div 包装层，样式 + 属性透传。 */
describe("Field", () => {
  it("渲染 div 并带 data-slot=field", () => {
    const { container } = render(() => <Field />);
    const element = container.querySelector('[data-slot="field"]');

    expect(element?.tagName).toBe("DIV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <Field class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="field"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("默认竖向、role=group，orientation 可覆盖", () => {
    const vertical = render(() => <Field />);
    const element = vertical.container.querySelector('[data-slot="field"]');
    expect(element?.getAttribute("role")).toBe("group");
    expect(element?.getAttribute("data-orientation")).toBe("vertical");

    const horizontal = render(() => <Field orientation="horizontal" />);
    expect(
      horizontal.container
        .querySelector('[data-slot="field"]')
        ?.getAttribute("data-orientation"),
    ).toBe("horizontal");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <Field id="x" aria-label="标签">
        <span data-testid="child">内容</span>
      </Field>
    ));
    const element = container.querySelector('[data-slot="field"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("标签");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
