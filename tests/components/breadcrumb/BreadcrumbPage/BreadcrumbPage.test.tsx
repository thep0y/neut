import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { BreadcrumbPage } from "~/components/breadcrumb/BreadcrumbPage/BreadcrumbPage";

/** BreadcrumbPage：当前页，用 `aria-current` 表达而不是链接。 */
describe("BreadcrumbPage", () => {
  it("渲染 span，带 aria-current=page 且不可交互但可聚焦", () => {
    const { container } = render(() => <BreadcrumbPage>当前页</BreadcrumbPage>);
    const page = container.querySelector('[data-slot="breadcrumb-page"]')!;

    expect(page.tagName).toBe("SPAN");
    expect(page.getAttribute("aria-current")).toBe("page");
    expect(page.getAttribute("aria-disabled")).toBe("true");
    expect(page.getAttribute("tabindex")).toBe("0");
    expect(page.textContent).toBe("当前页");
  });

  it("合并类名与 classList 并透传其余属性", () => {
    const { container } = render(() => (
      <BreadcrumbPage class="my-page" classList={{ bold: true }} id="p" />
    ));
    const page = container.querySelector('[data-slot="breadcrumb-page"]')!;

    expect(page.className).toContain("my-page");
    expect(page.className).toContain("bold");
    expect(page.id).toBe("p");
  });
});
