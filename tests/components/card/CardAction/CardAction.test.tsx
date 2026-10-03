import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { CardAction } from "~/components/card/CardAction/CardAction";

/** CardAction：`data-slot="card-action"` 的 div 部件。 */
describe("CardAction", () => {
  it("渲染 div 并带 data-slot", () => {
    const { container } = render(() => <CardAction />);
    const element = container.querySelector('[data-slot="card-action"]');

    expect(element?.tagName).toBe("DIV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <CardAction class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="card-action"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <CardAction id="x" aria-label="卡片">
        <span data-testid="child">内容</span>
      </CardAction>
    ));
    const element = container.querySelector('[data-slot="card-action"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("卡片");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
