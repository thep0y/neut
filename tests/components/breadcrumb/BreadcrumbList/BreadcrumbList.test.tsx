import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { BreadcrumbList } from "~/components/breadcrumb/BreadcrumbList/BreadcrumbList";

/** BreadcrumbList：`data-slot="breadcrumb-list"` 的 ol 包装层。 */
describe("BreadcrumbList", () => {
  it("渲染并带 data-slot", () => {
    const { container } = render(() => <BreadcrumbList />);
    const element = container.querySelector('[data-slot="breadcrumb-list"]');

    expect(element?.tagName).toBe("OL");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <BreadcrumbList class="my-class" classList={{ "is-on": true }} />
    ));
    const element = container.querySelector('[data-slot="breadcrumb-list"]');

    expect(element?.className).toContain("my-class");
    expect(element?.className).toContain("is-on");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <BreadcrumbList id="x" aria-label="面包屑">
        <span data-testid="child">内容</span>
      </BreadcrumbList>
    ));
    const element = container.querySelector('[data-slot="breadcrumb-list"]');

    expect(element?.id).toBe("x");
    expect(element?.getAttribute("aria-label")).toBe("面包屑");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
