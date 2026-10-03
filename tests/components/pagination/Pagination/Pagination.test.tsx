import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Pagination } from "~/components/pagination/Pagination/Pagination";

/** Pagination：`nav[aria-label=pagination]` 容器。 */
describe("Pagination", () => {
  it("渲染 nav 并带 aria-label 与 data-slot", () => {
    const { container } = render(() => <Pagination />);
    const nav = container.querySelector('[data-slot="pagination"]');

    expect(nav?.tagName).toBe("NAV");
    expect(nav?.getAttribute("aria-label")).toBe("pagination");
  });

  it("合并类名与 classList", () => {
    const { container } = render(() => (
      <Pagination class="my-pagination" classList={{ "is-centered": true }} />
    ));
    const nav = container.querySelector('[data-slot="pagination"]');

    expect(nav?.className).toContain("my-pagination");
    expect(nav?.className).toContain("is-centered");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <Pagination id="pg">
        <span data-testid="child" />
      </Pagination>
    ));

    expect(container.querySelector('[data-slot="pagination"]')?.id).toBe("pg");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});
