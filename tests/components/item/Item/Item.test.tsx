import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Item } from "~/components/item/Item/Item";

/**
 * Item：条目容器（默认 div，可用 `component` 换成别的标签）。
 * 三个 variant 与两个 size 只体现在类名上。
 */
function itemOf(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-slot="item"]');
}

describe("Item - 默认值", () => {
  it("渲染 div，默认 variant=ghost、size=sm", () => {
    const { container } = render(() => <Item />);
    const element = itemOf(container)!;

    expect(element.tagName).toBe("DIV");
    expect(element.className).toContain("border-transparent");
    expect(element.className).toContain("px-3");
  });

  it("component 可换成别的标签", () => {
    const { container } = render(() => <Item component="li" />);

    expect(itemOf(container)?.tagName).toBe("LI");
  });

  it("合并外部 class 与 classList", () => {
    const { container } = render(() => (
      <Item class="my-item" classList={{ "is-compact": true }} />
    ));
    const element = itemOf(container)!;

    expect(element.className).toContain("my-item");
    expect(element.className).toContain("is-compact");
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <Item id="row-1">
        <span data-testid="child" />
      </Item>
    ));

    expect(itemOf(container)?.id).toBe("row-1");
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
  });
});

describe("Item - variant 与 size", () => {
  it("variant=outline 加边框、variant=muted 加底色", () => {
    const outline = render(() => <Item variant="outline" />);
    expect(itemOf(outline.container)?.className).toContain("border-border");

    const muted = render(() => <Item variant="muted" />);
    expect(itemOf(muted.container)?.className).toContain("bg-muted/50");
  });

  it("size=xs 的内边距与 sm 不同", () => {
    const xs = render(() => <Item size="xs" />);
    expect(itemOf(xs.container)?.className).toContain("px-2.5");

    const sm = render(() => <Item size="sm" />);
    expect(itemOf(sm.container)?.className).toContain("px-3");
  });

  it("size 与 variant 写到 data 属性上，供子部件的 group-data-* 样式响应", () => {
    const { container } = render(() => <Item size="xs" variant="outline" />);
    const element = itemOf(container)!;

    expect(element.getAttribute("data-size")).toBe("xs");
    expect(element.getAttribute("data-variant")).toBe("outline");
    expect(element.className).toContain("group/item");
  });
});
