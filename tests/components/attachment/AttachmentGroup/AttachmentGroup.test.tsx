import { render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { AttachmentGroup } from "~/components/attachment/AttachmentGroup/AttachmentGroup";

function groupOf(container: HTMLElement): HTMLElement {
  return container.querySelector(
    '[data-slot="attachment-group"]',
  ) as HTMLElement;
}

/** AttachmentGroup：横向滚动、吸附对齐的附件行容器。 */
describe("AttachmentGroup", () => {
  it("渲染 div 并带 data-slot", () => {
    const { container } = render(() => <AttachmentGroup />);
    const element = groupOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-slot")).toBe("attachment-group");
  });

  it("带横向吸附与两端渐隐的类名", () => {
    const { container } = render(() => <AttachmentGroup />);
    const element = groupOf(container);

    expect(element.classList.contains("scroll-fade-x")).toBe(true);
    expect(element.classList.contains("snap-x")).toBe(true);
  });

  it("合并 class 与 classList", () => {
    const { container } = render(() => (
      <AttachmentGroup class="my-row" classList={{ "is-wide": true }} />
    ));
    const element = groupOf(container);

    expect(element.classList.contains("my-row")).toBe(true);
    expect(element.classList.contains("is-wide")).toBe(true);
  });

  it("透传其余属性、角色、事件与 children", () => {
    const onClick = vi.fn();
    const { container, getAllByTestId } = render(() => (
      <AttachmentGroup
        role="list"
        aria-label="附件列表"
        tabindex="0"
        onClick={onClick}
      >
        <span data-testid="item" />
        <span data-testid="item" />
      </AttachmentGroup>
    ));
    const element = groupOf(container);

    expect(element.getAttribute("role")).toBe("list");
    expect(element.getAttribute("aria-label")).toBe("附件列表");
    expect(element.getAttribute("tabindex")).toBe("0");
    expect(getAllByTestId("item")).toHaveLength(2);

    element.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
