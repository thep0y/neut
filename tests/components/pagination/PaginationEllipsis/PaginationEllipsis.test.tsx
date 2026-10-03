import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { PaginationEllipsis } from "~/components/pagination/PaginationEllipsis/PaginationEllipsis";

/** PaginationEllipsis：省略号，对辅助技术隐藏但保留可读文案。 */
describe("PaginationEllipsis", () => {
  it("渲染 aria-hidden 的 span、图标与 sr-only 文案", () => {
    const { container } = render(() => <PaginationEllipsis />);
    const element = container.querySelector(
      '[data-slot="pagination-ellipsis"]',
    );

    expect(element?.tagName).toBe("SPAN");
    // JSX 里 aria-hidden 是普通属性，渲染成空串属性
    expect(element?.hasAttribute("aria-hidden")).toBe(true);
    expect(element?.querySelector("svg")).not.toBeNull();
    expect(element?.querySelector(".sr-only")?.textContent).toBe("More pages");
  });

  it("合并类名与 classList 并透传其余属性", () => {
    const { container } = render(() => (
      <PaginationEllipsis class="my-dots" classList={{ "is-faded": true }} />
    ));
    const element = container.querySelector(
      '[data-slot="pagination-ellipsis"]',
    );

    expect(element?.className).toContain("my-dots");
    expect(element?.className).toContain("is-faded");
  });
});
