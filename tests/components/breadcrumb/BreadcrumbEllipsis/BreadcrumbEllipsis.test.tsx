import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { BreadcrumbEllipsis } from "~/components/breadcrumb/BreadcrumbEllipsis/BreadcrumbEllipsis";

/** BreadcrumbEllipsis：折叠标记，视觉上隐藏但对辅助技术保留 "More" 文案。 */
describe("BreadcrumbEllipsis", () => {
  it("渲染省略号与 sr-only 文案，且对辅助技术隐藏", () => {
    const { container } = render(() => <BreadcrumbEllipsis />);
    const ellipsis = container.querySelector(
      '[data-slot="breadcrumb-ellipsis"]',
    )!;

    expect(ellipsis.tagName).toBe("SPAN");
    expect(ellipsis.getAttribute("role")).toBe("presentation");
    expect(ellipsis.getAttribute("aria-hidden")).toBe("true");
    expect(ellipsis.querySelector("svg")).not.toBeNull();
    expect(ellipsis.querySelector(".sr-only")?.textContent).toBe("More");
  });

  it("合并类名与 classList 并透传其余属性", () => {
    const { container } = render(() => (
      <BreadcrumbEllipsis class="my-dots" classList={{ faded: true }} id="e" />
    ));
    const ellipsis = container.querySelector(
      '[data-slot="breadcrumb-ellipsis"]',
    )!;

    expect(ellipsis.className).toContain("my-dots");
    expect(ellipsis.className).toContain("faded");
    expect(ellipsis.id).toBe("e");
  });
});
