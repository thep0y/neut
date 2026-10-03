import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { CardFooter } from "~/components/card/CardFooter/CardFooter";

/** CardFooter：`data-slot="card-footer"` 的 div 部件。 */
describe("CardFooter", () => {
  it("渲染 div 并带 data-slot", () => {
    const { container } = render(() => <CardFooter />);
    const element = container.querySelector('[data-slot="card-footer"]');

    expect(element?.tagName).toBe("DIV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <CardFooter class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="card-footer"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <CardFooter id="x" aria-label="卡片">
        <span data-testid="child">内容</span>
      </CardFooter>
    ));
    const element = container.querySelector('[data-slot="card-footer"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("卡片");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
