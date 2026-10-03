import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { FieldTitle } from "~/components/field/FieldTitle/FieldTitle";

/**
 * FieldTitle：field 里的小标题。
 * 注意它与 FieldLabel 共用 `data-slot="field-label"`（与 upstream 保持一致），
 * 因此这里断言类名区分而不是靠 slot。
 */
describe("FieldTitle", () => {
  it("渲染 div 并带 data-slot=field-label", () => {
    const { container } = render(() => <FieldTitle>标题</FieldTitle>);
    const element = container.querySelector('[data-slot="field-label"]');

    expect(element?.tagName).toBe("DIV");
    expect(element?.textContent).toBe("标题");
    expect(element?.className).toContain("text-sm font-medium");
  });

  it("合并 class / classList 并透传其余属性", () => {
    const { container } = render(() => (
      <FieldTitle class="my-title" classList={{ "is-wide": true }} id="t" />
    ));
    const element = container.querySelector('[data-slot="field-label"]');

    expect(element?.className).toContain("my-title");
    expect(element?.className).toContain("is-wide");
    expect(element?.id).toBe("t");
  });
});
