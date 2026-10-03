import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { AttachmentDescription } from "~/components/attachment/AttachmentDescription/AttachmentDescription";

function descriptionOf(container: HTMLElement): HTMLElement {
  return container.querySelector(
    '[data-slot="attachment-description"]',
  ) as HTMLElement;
}

/** AttachmentDescription：文件类型 / 大小 / 失败原因等次要信息。 */
describe("AttachmentDescription", () => {
  it("渲染 span 并带 data-slot", () => {
    const { container } = render(() => <AttachmentDescription />);
    const element = descriptionOf(container);

    expect(element.tagName).toBe("SPAN");
    expect(element.getAttribute("data-slot")).toBe("attachment-description");
    expect(element.classList.contains("text-muted-foreground")).toBe(true);
  });

  it("带 error 状态下变红的父级选择器", () => {
    const { container } = render(() => <AttachmentDescription />);

    expect(
      descriptionOf(container).classList.contains(
        "group-data-[state=error]/attachment:text-destructive/80",
      ),
    ).toBe(true);
  });

  it("合并 class 与 classList", () => {
    const { container } = render(() => (
      <AttachmentDescription
        class="my-description"
        classList={{ "is-error": true }}
      />
    ));
    const element = descriptionOf(container);

    expect(element.classList.contains("my-description")).toBe(true);
    expect(element.classList.contains("is-error")).toBe(true);
  });

  it("透传其余属性与 children（失败原因不只靠颜色表达）", () => {
    const { container } = render(() => (
      <AttachmentDescription aria-live="polite">
        上传失败：文件超过 25 MB
      </AttachmentDescription>
    ));
    const element = descriptionOf(container);

    expect(element.getAttribute("aria-live")).toBe("polite");
    expect(element.textContent).toBe("上传失败：文件超过 25 MB");
  });
});
