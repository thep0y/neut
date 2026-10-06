import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Empty } from "~/components/empty/Empty/Empty";

/** Empty：`data-slot="empty"` 的 div 部件。 */
describe("Empty", () => {
  it("渲染 div 并带 data-slot", () => {
    const { container } = render(() => <Empty />);
    const element = container.querySelector('[data-slot="empty"]');

    expect(element?.tagName).toBe("DIV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <Empty class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="empty"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <Empty id="x" aria-label="空状态">
        <span data-testid="child">内容</span>
      </Empty>
    ));
    const element = container.querySelector('[data-slot="empty"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("空状态");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
