import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { EmptyHeader } from "~/components/empty/EmptyHeader/EmptyHeader";

/** EmptyHeader：`data-slot="empty-header"` 的 div 部件。 */
describe("EmptyHeader", () => {
  it("渲染 div 并带 data-slot", () => {
    const { container } = render(() => <EmptyHeader />);
    const element = container.querySelector('[data-slot="empty-header"]');

    expect(element?.tagName).toBe("DIV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <EmptyHeader class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="empty-header"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <EmptyHeader id="x" aria-label="空状态">
        <span data-testid="child">内容</span>
      </EmptyHeader>
    ));
    const element = container.querySelector('[data-slot="empty-header"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("空状态");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
