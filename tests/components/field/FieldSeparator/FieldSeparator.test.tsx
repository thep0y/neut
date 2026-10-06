import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { FieldSeparator } from "~/components/field/FieldSeparator/FieldSeparator";

/** FieldSeparator：一条分隔线，可选中间文字（有文字时 data-content 为 true）。 */
describe("FieldSeparator", () => {
  it("没有 children 时只有分隔线，data-content=false", () => {
    const { container } = render(() => <FieldSeparator />);
    const element = container.querySelector('[data-slot="field-separator"]');

    expect(element?.getAttribute("data-content")).toBe("false");
    expect(element?.querySelector('[data-slot="separator"]')).not.toBeNull();
    expect(
      element?.querySelector('[data-slot="field-separator-content"]'),
    ).toBeNull();
  });

  it("有 children 时渲染中间文字，data-content=true", () => {
    const { container } = render(() => <FieldSeparator>或</FieldSeparator>);
    const element = container.querySelector('[data-slot="field-separator"]');

    expect(element?.getAttribute("data-content")).toBe("true");
    const content = element?.querySelector(
      '[data-slot="field-separator-content"]',
    );
    expect(content?.textContent).toBe("或");
  });

  it("合并 class / classList 并透传其余属性", () => {
    const { container } = render(() => (
      <FieldSeparator class="my-sep" classList={{ "is-thin": true }}>
        或
      </FieldSeparator>
    ));
    const element = container.querySelector('[data-slot="field-separator"]');

    expect(element?.className).toContain("my-sep");
    expect(element?.className).toContain("is-thin");
  });
});
