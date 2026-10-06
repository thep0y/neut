import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AttachmentAction } from "~/components/attachment/AttachmentAction/AttachmentAction";

function actionOf(container: HTMLElement): HTMLElement {
  return container.querySelector(
    '[data-slot="attachment-action"]',
  ) as HTMLElement;
}

/**
 * AttachmentAction：复用 Button，默认 ghost + xs（图标按钮），
 * 并把 data-slot 换成 attachment-action 以便定位。
 */
describe("AttachmentAction - 默认值", () => {
  it("渲染 button，带 attachment-action 槽位而不是 button 槽位", () => {
    const { container } = render(() => <AttachmentAction aria-label="移除" />);
    const element = actionOf(container);

    expect(element.tagName).toBe("BUTTON");
    expect(element.getAttribute("type")).toBe("button");
    expect(container.querySelector('[data-slot="button"]')).toBeNull();
  });

  it("默认 variant=ghost、size=xs", () => {
    const { container } = render(() => <AttachmentAction aria-label="移除" />);
    const element = actionOf(container);

    expect(element.classList.contains("hover:bg-muted")).toBe(true);
    expect(element.classList.contains("aria-expanded:bg-muted")).toBe(true);
    expect(element.classList.contains("bg-primary")).toBe(false);
    expect(element.classList.contains("h-6")).toBe(true);
    expect(element.classList.contains("h-8")).toBe(false);
  });
});

describe("AttachmentAction - 覆盖与透传", () => {
  it("显式 variant / size 覆盖默认值", () => {
    const { container } = render(() => (
      <AttachmentAction aria-label="删除" variant="destructive" size="md" />
    ));
    const element = actionOf(container);

    expect(element.classList.contains("bg-destructive/10")).toBe(true);
    expect(element.classList.contains("h-8")).toBe(true);
    expect(element.classList.contains("h-6")).toBe(false);
  });

  it("透传 aria-label、onClick、class 与 children", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(() => (
      <AttachmentAction
        aria-label="移除 sales.pdf"
        class="my-action"
        classList={{ "is-danger": true }}
        onClick={onClick}
      >
        <span data-testid="icon" />
      </AttachmentAction>
    ));
    const element = actionOf(container);

    expect(element.getAttribute("aria-label")).toBe("移除 sales.pdf");
    expect(element.classList.contains("my-action")).toBe(true);
    expect(element.classList.contains("is-danger")).toBe(true);
    expect(container.querySelector('[data-testid="icon"]')).not.toBeNull();

    await user.click(element);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
