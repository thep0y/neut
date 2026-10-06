import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { BreadcrumbSeparator } from "~/components/breadcrumb/BreadcrumbSeparator/BreadcrumbSeparator";

/** BreadcrumbSeparator：对辅助技术隐藏的分隔符，默认是右箭头图标。 */
describe("BreadcrumbSeparator", () => {
  it("默认渲染箭头图标，且 role=presentation + aria-hidden", () => {
    const { container } = render(() => <BreadcrumbSeparator />);
    const separator = container.querySelector(
      '[data-slot="breadcrumb-separator"]',
    )!;

    expect(separator.tagName).toBe("LI");
    expect(separator.getAttribute("role")).toBe("presentation");
    expect(separator.getAttribute("aria-hidden")).toBe("true");
    expect(separator.querySelector("svg")).not.toBeNull();
  });

  it("传 children 时替换默认图标", () => {
    const { container } = render(() => (
      <BreadcrumbSeparator>
        <span data-testid="slash">/</span>
      </BreadcrumbSeparator>
    ));

    expect(container.querySelector('[data-testid="slash"]')).not.toBeNull();
    expect(
      container.querySelector('[data-slot="breadcrumb-separator"] svg'),
    ).toBeNull();
  });

  it("合并类名与 classList", () => {
    const { container } = render(() => (
      <BreadcrumbSeparator class="my-sep" classList={{ rotated: true }} />
    ));
    const separator = container.querySelector(
      '[data-slot="breadcrumb-separator"]',
    )!;

    expect(separator.className).toContain("my-sep");
    expect(separator.className).toContain("rotated");
  });
});
