import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { PaginationNext } from "~/components/pagination/PaginationNext/PaginationNext";

/** PaginationNext：下一页链接，默认文案 Next，右侧箭头。 */
describe("PaginationNext", () => {
  it("默认渲染 Next 文案、箭头与 aria-label", () => {
    const { container } = render(() => <PaginationNext href="/2" />);
    const link = container.querySelector('[data-slot="pagination-link"]')!;

    expect(link.getAttribute("aria-label")).toBe("Go to next page");
    expect(link.textContent).toContain("Next");
    expect(link.querySelector("svg")).not.toBeNull();
    expect(link.getAttribute("href")).toBe("/2");
  });

  it("text 可覆盖", () => {
    const { container } = render(() => <PaginationNext text="下一页" />);

    expect(
      container.querySelector('[data-slot="pagination-link"]')?.textContent,
    ).toContain("下一页");
  });

  it("class 与 classList 合并到链接上", () => {
    const { container } = render(() => (
      <PaginationNext class="my-next" classList={{ "is-tail": true }} />
    ));
    const link = container.querySelector('[data-slot="pagination-link"]')!;

    expect(link.className).toContain("my-next");
    expect(link.className).toContain("is-tail");
    expect(link.className).toContain("pr-1.5!");
  });
});
