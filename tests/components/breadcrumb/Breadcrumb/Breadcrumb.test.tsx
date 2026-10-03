import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Breadcrumb } from "~/components/breadcrumb/Breadcrumb/Breadcrumb";

/** Breadcrumb：`data-slot="breadcrumb"` 的 nav 包装层。 */
describe("Breadcrumb", () => {
  it("渲染并带 data-slot", () => {
    const { container } = render(() => <Breadcrumb />);
    const element = container.querySelector('[data-slot="breadcrumb"]');

    expect(element?.tagName).toBe("NAV");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <Breadcrumb class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="breadcrumb"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <Breadcrumb id="x" aria-label="面包屑">
        <span data-testid="child">内容</span>
      </Breadcrumb>
    ));
    const element = container.querySelector('[data-slot="breadcrumb"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("面包屑");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
