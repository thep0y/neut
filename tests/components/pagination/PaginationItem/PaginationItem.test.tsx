import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { PaginationItem } from "~/components/pagination/PaginationItem/PaginationItem";

/** PaginationItem：`li` 包装，属性直接透传。 */
describe("PaginationItem", () => {
  it("渲染 li 并带 data-slot", () => {
    const { container } = render(() => (
      <PaginationItem>
        <a href="/2">2</a>
      </PaginationItem>
    ));
    const item = container.querySelector('[data-slot="pagination-item"]');

    expect(item?.tagName).toBe("LI");
    expect(item?.querySelector("a")?.getAttribute("href")).toBe("/2");
  });

  it("透传 class 与其余属性", () => {
    const { container } = render(() => (
      <PaginationItem class="my-item" id="item-1" />
    ));
    const item = container.querySelector('[data-slot="pagination-item"]');

    expect(item?.className).toBe("my-item");
    expect(item?.id).toBe("item-1");
  });
});
