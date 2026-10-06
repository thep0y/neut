import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AttachmentTrigger } from "~/components/attachment/AttachmentTrigger/AttachmentTrigger";

function triggerOf(container: HTMLElement): HTMLElement {
  return container.querySelector(
    '[data-slot="attachment-trigger"]',
  ) as HTMLElement;
}

/**
 * AttachmentTrigger：覆盖整卡的触发器（默认 button），位于操作区之下。
 * 默认 type="button" 是它的重要承诺 —— 放在表单里不该意外提交。
 */
describe("AttachmentTrigger - 默认 button", () => {
  it("渲染 button，type=button，并带覆盖整卡的类名", () => {
    const { container } = render(() => (
      <AttachmentTrigger aria-label="打开 research.pdf" />
    ));
    const element = triggerOf(container);

    expect(element.tagName).toBe("BUTTON");
    expect(element.getAttribute("type")).toBe("button");
    expect(element.classList.contains("absolute")).toBe(true);
    expect(element.classList.contains("inset-0")).toBe(true);
    expect(element.classList.contains("z-10")).toBe(true);
  });

  it("放在表单里点击不会提交（默认 type=button）", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const { container } = render(() => (
      <form onSubmit={onSubmit}>
        <AttachmentTrigger aria-label="打开" />
      </form>
    ));

    await user.click(triggerOf(container));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("显式 type=submit 时才会提交表单", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const { container } = render(() => (
      <form onSubmit={onSubmit}>
        <AttachmentTrigger type="submit" aria-label="提交" />
      </form>
    ));

    await user.click(triggerOf(container));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

describe("AttachmentTrigger - 多态与透传", () => {
  it("component=a 时渲染链接，不再带 type", () => {
    const { container } = render(() => (
      <AttachmentTrigger
        component="a"
        href="https://example.com/a.pdf"
        target="_blank"
        rel="noreferrer"
        aria-label="打开 a.pdf"
      />
    ));
    const element = triggerOf(container);

    expect(element.tagName).toBe("A");
    expect(element.getAttribute("href")).toBe("https://example.com/a.pdf");
    expect(element.getAttribute("target")).toBe("_blank");
    expect(element.getAttribute("rel")).toBe("noreferrer");
    expect(element.hasAttribute("type")).toBe(false);
  });

  it("合并 class，且用户自己的类名不会被内部类名顶掉", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(() => (
      <AttachmentTrigger class="my-trigger" onClick={onClick}>
        打开预览
      </AttachmentTrigger>
    ));
    const element = triggerOf(container);

    expect(element.classList.contains("my-trigger")).toBe(true);
    expect(element.classList.contains("absolute")).toBe(true);
    expect(element.classList.contains("inset-0")).toBe(true);
    expect(element.textContent).toBe("打开预览");

    await user.click(element);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
