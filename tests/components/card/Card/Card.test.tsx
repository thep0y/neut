import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Card } from "~/components/card/Card/Card";

/** Card：`data-slot="card"` 的 div 部件。 */
describe("Card", () => {
  it("渲染 div 并带 data-slot", () => {
    const { container } = render(() => <Card />);
    const element = container.querySelector('[data-slot="card"]');

    expect(element?.tagName).toBe("DIV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <Card class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="card"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <Card id="x" aria-label="卡片">
        <span data-testid="child">内容</span>
      </Card>
    ));
    const element = container.querySelector('[data-slot="card"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("卡片");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
