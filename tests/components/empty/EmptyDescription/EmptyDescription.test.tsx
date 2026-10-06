import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { EmptyDescription } from "~/components/empty/EmptyDescription/EmptyDescription";

/** EmptyDescription：`data-slot="empty-description"` 的 div 部件。 */
describe("EmptyDescription", () => {
  it("渲染 div 并带 data-slot", () => {
    const { container } = render(() => <EmptyDescription />);
    const element = container.querySelector('[data-slot="empty-description"]');

    expect(element?.tagName).toBe("DIV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <EmptyDescription class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="empty-description"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <EmptyDescription id="x" aria-label="空状态">
        <span data-testid="child">内容</span>
      </EmptyDescription>
    ));
    const element = container.querySelector('[data-slot="empty-description"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("空状态");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
