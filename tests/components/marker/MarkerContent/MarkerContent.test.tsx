import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { MarkerContent } from "~/components/marker/MarkerContent/MarkerContent";

function contentOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="marker-content"]') as HTMLElement;
}

/** MarkerContent：Marker 里承载文本的内容槽（span）。 */
describe("MarkerContent", () => {
  it("渲染 span，带 data-slot 与文本类名", () => {
    const { container } = render(() => <MarkerContent>已完成</MarkerContent>);
    const element = contentOf(container);

    expect(element.tagName).toBe("SPAN");
    expect(element.getAttribute("data-slot")).toBe("marker-content");
    expect(element.classList.contains("min-w-0")).toBe(true);
    expect(element.classList.contains("break-words")).toBe(true);
    expect(element.textContent).toBe("已完成");
  });

  it("带 separator 变体的父级选择器（文本居中、不伸缩）", () => {
    const { container } = render(() => <MarkerContent />);
    const element = contentOf(container);

    expect(
      element.classList.contains(
        "group-data-[variant=separator]/marker:flex-none",
      ),
    ).toBe(true);
    expect(
      element.classList.contains(
        "group-data-[variant=separator]/marker:text-center",
      ),
    ).toBe(true);
  });

  it("合并 class 与 classList，且内置类名不被顶掉", () => {
    const { container } = render(() => (
      <MarkerContent class="my-text" classList={{ "is-long": true }} />
    ));
    const element = contentOf(container);

    expect(element.classList.contains("my-text")).toBe(true);
    expect(element.classList.contains("is-long")).toBe(true);
    expect(element.classList.contains("break-words")).toBe(true);
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <MarkerContent id="mc" data-content-id="c-1">
        <span data-testid="inner">内容</span>
      </MarkerContent>
    ));
    const element = contentOf(container);

    expect(element.id).toBe("mc");
    expect(element.getAttribute("data-content-id")).toBe("c-1");
    expect(container.querySelector('[data-testid="inner"]')?.textContent).toBe(
      "内容",
    );
  });
});
