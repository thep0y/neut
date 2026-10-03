import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { AttachmentContent } from "~/components/attachment/AttachmentContent/AttachmentContent";

function contentOf(container: HTMLElement): HTMLElement {
  return container.querySelector(
    '[data-slot="attachment-content"]',
  ) as HTMLElement;
}

/** AttachmentContent：包裹标题与描述的容器。 */
describe("AttachmentContent", () => {
  it("渲染 div 并带 data-slot", () => {
    const { container } = render(() => <AttachmentContent />);
    const element = contentOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-slot")).toBe("attachment-content");
    expect(element.classList.contains("leading-tight")).toBe(true);
  });

  it("合并 class 与 classList", () => {
    const { container } = render(() => (
      <AttachmentContent class="my-content" classList={{ "is-muted": true }} />
    ));
    const element = contentOf(container);

    expect(element.classList.contains("my-content")).toBe(true);
    expect(element.classList.contains("is-muted")).toBe(true);
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <AttachmentContent id="c1" dir="rtl">
        <span data-testid="child">标题</span>
      </AttachmentContent>
    ));
    const element = contentOf(container);

    expect(element.id).toBe("c1");
    expect(element.getAttribute("dir")).toBe("rtl");
    expect(container.querySelector('[data-testid="child"]')?.textContent).toBe(
      "标题",
    );
  });
});
