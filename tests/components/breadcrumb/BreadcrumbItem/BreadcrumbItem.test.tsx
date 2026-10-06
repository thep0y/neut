import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { BreadcrumbItem } from "~/components/breadcrumb/BreadcrumbItem/BreadcrumbItem";

/** BreadcrumbItem：`data-slot="breadcrumb-item"` 的 li 包装层。 */
describe("BreadcrumbItem", () => {
  it("渲染并带 data-slot", () => {
    const { container } = render(() => <BreadcrumbItem />);
    const element = container.querySelector('[data-slot="breadcrumb-item"]');

    expect(element?.tagName).toBe("LI");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <BreadcrumbItem class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="breadcrumb-item"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <BreadcrumbItem id="x" aria-label="面包屑">
        <span data-testid="child">内容</span>
      </BreadcrumbItem>
    ));
    const element = container.querySelector('[data-slot="breadcrumb-item"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("面包屑");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
