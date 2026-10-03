import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { BreadcrumbLink } from "~/components/breadcrumb/BreadcrumbLink/BreadcrumbLink";

/** BreadcrumbLink：默认渲染 `a`，多态 component 可换成自定义组件/标签。 */
function linkOf(container: HTMLElement): HTMLElement {
  return container.querySelector(
    '[data-slot="breadcrumb-link"]',
  ) as HTMLElement;
}

describe("BreadcrumbLink", () => {
  it("默认渲染 a 并带上 href", () => {
    const { container } = render(() => (
      <BreadcrumbLink href="/docs">文档</BreadcrumbLink>
    ));
    const link = linkOf(container);

    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/docs");
    expect(link.textContent).toBe("文档");
  });

  it("component 可换成 span 等标签（多态）", () => {
    const { container } = render(() => (
      <BreadcrumbLink component="span">不可跳转</BreadcrumbLink>
    ));

    expect(linkOf(container).tagName).toBe("SPAN");
  });

  it("合并类名与 classList 并透传其余属性", () => {
    const { container } = render(() => (
      <BreadcrumbLink class="my-link" classList={{ "is-active": true }} id="l">
        文档
      </BreadcrumbLink>
    ));
    const link = linkOf(container);

    expect(link.className).toContain("my-link");
    expect(link.className).toContain("is-active");
    expect(link.id).toBe("l");
  });
});
