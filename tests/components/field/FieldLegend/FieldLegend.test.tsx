import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { FieldLegend } from "~/components/field/FieldLegend/FieldLegend";

/** FieldLegend：fieldset 的图例，默认 variant=legend。 */
describe("FieldLegend", () => {
  it("渲染 legend，默认 variant=legend", () => {
    const { container } = render(() => <FieldLegend>收货信息</FieldLegend>);
    const element = container.querySelector('[data-slot="field-legend"]');

    expect(element?.tagName).toBe("LEGEND");
    expect(element?.getAttribute("data-variant")).toBe("legend");
    expect(element?.className).toContain("data-[variant=legend]:text-base");
  });

  it("variant=label 时样式与 data 属性同步变化", () => {
    const { container } = render(() => <FieldLegend variant="label" />);
    const element = container.querySelector('[data-slot="field-legend"]');

    expect(element?.getAttribute("data-variant")).toBe("label");
    expect(element?.className).toContain("data-[variant=label]:text-sm");
  });

  it("合并 class / classList 并透传其余属性", () => {
    const { container } = render(() => (
      <FieldLegend class="my-legend" classList={{ "is-bold": true }} id="lg" />
    ));
    const element = container.querySelector('[data-slot="field-legend"]');

    expect(element?.className).toContain("my-legend");
    expect(element?.className).toContain("is-bold");
    expect(element?.id).toBe("lg");
  });
});
