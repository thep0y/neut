import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { PaginationLink } from "~/components/pagination/PaginationLink/PaginationLink";

/**
 * PaginationLink：按钮外观的链接。激活态用 outline 变体 + `aria-current=page`，
 * 非激活态用 ghost；`page` 单独传入时渲染成"只有页码"的图标态并补 aria-label。
 */
function linkOf(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-slot="pagination-link"]');
}

describe("PaginationLink - 结构与状态", () => {
  it("默认渲染成 a 元素，data-active 为 undefined（属性缺失）", () => {
    const { container } = render(() => <PaginationLink>1</PaginationLink>);
    const link = linkOf(container)!;

    expect(link.tagName).toBe("A");
    // isActive 为 undefined → 属性被移除
    expect(link.hasAttribute("data-active")).toBe(false);
    expect(link.hasAttribute("aria-current")).toBe(false);
  });

  it("激活时 aria-current=page 且用 outline 变体", () => {
    const { container } = render(() => (
      <PaginationLink isActive>2</PaginationLink>
    ));
    const link = linkOf(container)!;

    expect(link.getAttribute("aria-current")).toBe("page");
    expect(link.className).toContain("border-border");
  });

  it("非激活时用 ghost 变体", () => {
    const { container } = render(() => <PaginationLink>3</PaginationLink>);
    const link = linkOf(container)!;

    expect(link.className).toContain("hover:bg-muted");
    expect(link.className).not.toContain("border-border");
  });

  it("size 默认 md，可覆盖（体现在类名上）", () => {
    const medium = render(() => <PaginationLink>4</PaginationLink>);
    expect(linkOf(medium.container)?.className).toContain("h-8");

    const small = render(() => <PaginationLink size="sm">4</PaginationLink>);
    expect(linkOf(small.container)?.className).toContain("h-7");
  });
});

describe("PaginationLink - page 与 children", () => {
  // 类型是联合类型：要么只给 page（图标态），要么只给 children（自定义内容）
  it("只传 page 且没有 children 时渲染图标态并补 aria-label", () => {
    const { container } = render(() => <PaginationLink page={3} />);
    const link = linkOf(container)!;

    expect(link.getAttribute("aria-label")).toBe("Page 3");
    expect(link.textContent).toContain("3");
  });

  it("没有 page 时渲染 children", () => {
    const { container } = render(() => (
      <PaginationLink>
        <span data-testid="label">首页</span>
      </PaginationLink>
    ));

    expect(container.querySelector('[data-testid="label"]')).not.toBeNull();
  });
});

describe("PaginationLink - 属性透传", () => {
  it("合并类名与 classList，并透传 href 等其余属性", () => {
    const { container } = render(() => (
      <PaginationLink
        page={2}
        class="my-link"
        classList={{ "is-wide": true }}
        href="/page/2"
      />
    ));
    const link = linkOf(container)!;

    expect(link.className).toContain("my-link");
    expect(link.className).toContain("is-wide");
    expect(link.getAttribute("href")).toBe("/page/2");
  });

  it("点击会调用调用方的 onClick", () => {
    let clicked = 0;
    const { container } = render(() => (
      <PaginationLink onClick={() => (clicked += 1)}>1</PaginationLink>
    ));

    linkOf(container)!.click();

    expect(clicked).toBe(1);
  });
});
