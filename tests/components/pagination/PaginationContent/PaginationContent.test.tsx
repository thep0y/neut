import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { PaginationContent } from "~/components/pagination/PaginationContent/PaginationContent";

/** PaginationContent：`ul` 列表容器。 */
describe("PaginationContent", () => {
  it("渲染 ul 并合并类名/classList", () => {
    const { container } = render(() => (
      <PaginationContent class="my-list" classList={{ "is-tight": true }} />
    ));
    const list = container.querySelector('[data-slot="pagination-content"]');

    expect(list?.tagName).toBe("UL");
    expect(list?.className).toContain("my-list");
    expect(list?.className).toContain("is-tight");
  });

  it("渲染 children 并透传其余属性", () => {
    const { container } = render(() => (
      <PaginationContent aria-label="分页">
        <li data-testid="row" />
      </PaginationContent>
    ));

    expect(container.querySelector('[data-testid="row"]')).not.toBeNull();
    expect(
      container
        .querySelector('[data-slot="pagination-content"]')
        ?.getAttribute("aria-label"),
    ).toBe("分页");
  });
});
