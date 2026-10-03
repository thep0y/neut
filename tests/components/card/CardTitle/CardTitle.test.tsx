import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { CardTitle } from "~/components/card/CardTitle/CardTitle";

/** CardTitle：`data-slot="card-title"` 的 div 部件。 */
describe("CardTitle", () => {
  it("渲染 div 并带 data-slot", () => {
    const { container } = render(() => <CardTitle />);
    const element = container.querySelector('[data-slot="card-title"]');

    expect(element?.tagName).toBe("DIV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <CardTitle class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="card-title"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <CardTitle id="x" aria-label="卡片">
        <span data-testid="child">内容</span>
      </CardTitle>
    ));
    const element = container.querySelector('[data-slot="card-title"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("卡片");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
