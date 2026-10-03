import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { EmptyTitle } from "~/components/empty/EmptyTitle/EmptyTitle";

/** EmptyTitle：`data-slot="empty-title"` 的 div 部件。 */
describe("EmptyTitle", () => {
  it("渲染 div 并带 data-slot", () => {
    const { container } = render(() => <EmptyTitle />);
    const element = container.querySelector('[data-slot="empty-title"]');

    expect(element?.tagName).toBe("DIV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <EmptyTitle class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="empty-title"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <EmptyTitle id="x" aria-label="空状态">
        <span data-testid="child">内容</span>
      </EmptyTitle>
    ));
    const element = container.querySelector('[data-slot="empty-title"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("空状态");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
