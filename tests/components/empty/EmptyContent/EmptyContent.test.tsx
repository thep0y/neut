import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { EmptyContent } from "~/components/empty/EmptyContent/EmptyContent";

/** EmptyContent：`data-slot="empty-content"` 的 div 部件。 */
describe("EmptyContent", () => {
  it("渲染 div 并带 data-slot", () => {
    const { container } = render(() => <EmptyContent />);
    const element = container.querySelector('[data-slot="empty-content"]');

    expect(element?.tagName).toBe("DIV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <EmptyContent class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="empty-content"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <EmptyContent id="x" aria-label="空状态">
        <span data-testid="child">内容</span>
      </EmptyContent>
    ));
    const element = container.querySelector('[data-slot="empty-content"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("空状态");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
