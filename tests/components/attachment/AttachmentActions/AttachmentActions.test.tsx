import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { AttachmentActions } from "~/components/attachment/AttachmentActions/AttachmentActions";

function actionsOf(container: HTMLElement): HTMLElement {
  return container.querySelector(
    '[data-slot="attachment-actions"]',
  ) as HTMLElement;
}

/** AttachmentActions：操作区容器，纵向时绝对定位到右上角。 */
describe("AttachmentActions", () => {
  it("渲染 div 并带 data-slot", () => {
    const { container } = render(() => <AttachmentActions />);
    const element = actionsOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-slot")).toBe("attachment-actions");
  });

  it("操作区在触发器之上（z-20）且带纵向定位选择器", () => {
    const { container } = render(() => <AttachmentActions />);
    const element = actionsOf(container);

    expect(element.classList.contains("z-20")).toBe(true);
    expect(
      element.classList.contains(
        "group-data-[orientation=vertical]/attachment:absolute",
      ),
    ).toBe(true);
  });

  it("合并 class 与 classList", () => {
    const { container } = render(() => (
      <AttachmentActions class="my-actions" classList={{ "is-inline": true }} />
    ));
    const element = actionsOf(container);

    expect(element.classList.contains("my-actions")).toBe(true);
    expect(element.classList.contains("is-inline")).toBe(true);
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <AttachmentActions aria-label="附件操作">
        <button type="button" data-testid="action">
          移除
        </button>
      </AttachmentActions>
    ));

    expect(actionsOf(container).getAttribute("aria-label")).toBe("附件操作");
    expect(container.querySelector('[data-testid="action"]')).not.toBeNull();
  });
});
