import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { PaginationPrevious } from "~/components/pagination/PaginationPrevious/PaginationPrevious";

/** PaginationPrevious：上一页链接，默认文案 Previous，左侧箭头。 */
describe("PaginationPrevious", () => {
  it("默认渲染 Previous 文案、箭头与 aria-label", () => {
    const { container } = render(() => <PaginationPrevious href="/0" />);
    const link = container.querySelector('[data-slot="pagination-link"]')!;

    expect(link.getAttribute("aria-label")).toBe("Go to previous page");
    expect(link.textContent).toContain("Previous");
    expect(link.querySelector("svg")).not.toBeNull();
    expect(link.getAttribute("href")).toBe("/0");
  });

  it("text 可覆盖", () => {
    const { container } = render(() => <PaginationPrevious text="上一页" />);

    expect(
      container.querySelector('[data-slot="pagination-link"]')?.textContent,
    ).toContain("上一页");
  });

  it("class 与 classList 合并到链接上", () => {
    const { container } = render(() => (
      <PaginationPrevious class="my-prev" classList={{ "is-head": true }} />
    ));
    const link = container.querySelector('[data-slot="pagination-link"]')!;

    expect(link.className).toContain("my-prev");
    expect(link.className).toContain("is-head");
    expect(link.className).toContain("pl-1.5!");
  });
});
