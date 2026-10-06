import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { FieldLabel } from "~/components/field/FieldLabel/FieldLabel";

/** FieldLabel：复用 Label 的标签，额外挂 field 相关样式。 */
describe("FieldLabel", () => {
  it("渲染 label 并带 data-slot=field-label", () => {
    const { container } = render(() => <FieldLabel>姓名</FieldLabel>);
    const element = container.querySelector('[data-slot="field-label"]');

    expect(element?.tagName).toBe("LABEL");
    expect(element?.textContent).toBe("姓名");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <FieldLabel class="my-label" classList={{ "is-inline": true }} />
    ));
    const element = container.querySelector('[data-slot="field-label"]');

    expect(element?.className).toContain("my-label");
    expect(element?.className).toContain("is-inline");
  });

  it("透传 htmlFor 等属性", () => {
    const { container } = render(() => <FieldLabel for="input-a" />);

    expect(
      container.querySelector('[data-slot="field-label"]')?.getAttribute("for"),
    ).toBe("input-a");
  });
});
