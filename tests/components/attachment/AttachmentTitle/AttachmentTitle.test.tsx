import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { AttachmentTitle } from "~/components/attachment/AttachmentTitle/AttachmentTitle";

function titleOf(container: HTMLElement): HTMLElement {
  return container.querySelector(
    '[data-slot="attachment-title"]',
  ) as HTMLElement;
}

/** AttachmentTitle：附件名；uploading / processing 时由父级 data-state 驱动 shimmer。 */
describe("AttachmentTitle", () => {
  it("渲染 span 并带 data-slot", () => {
    const { container } = render(() => <AttachmentTitle />);
    const element = titleOf(container);

    expect(element.tagName).toBe("SPAN");
    expect(element.getAttribute("data-slot")).toBe("attachment-title");
    expect(element.classList.contains("truncate")).toBe(true);
    expect(element.classList.contains("font-medium")).toBe(true);
  });

  it("带 shimmer 的父级状态选择器", () => {
    const { container } = render(() => <AttachmentTitle />);
    const element = titleOf(container);

    expect(
      element.classList.contains(
        "group-data-[state=uploading]/attachment:shimmer",
      ),
    ).toBe(true);
    expect(
      element.classList.contains(
        "group-data-[state=processing]/attachment:shimmer",
      ),
    ).toBe(true);
  });

  it("合并 class 与 classList", () => {
    const { container } = render(() => (
      <AttachmentTitle class="my-title" classList={{ "is-long": true }} />
    ));
    const element = titleOf(container);

    expect(element.classList.contains("my-title")).toBe(true);
    expect(element.classList.contains("is-long")).toBe(true);
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <AttachmentTitle title="sales.pdf">sales.pdf</AttachmentTitle>
    ));
    const element = titleOf(container);

    expect(element.getAttribute("title")).toBe("sales.pdf");
    expect(element.textContent).toBe("sales.pdf");
  });
});
