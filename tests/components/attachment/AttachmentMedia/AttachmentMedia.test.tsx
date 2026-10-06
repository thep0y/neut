import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { AttachmentMedia } from "~/components/attachment/AttachmentMedia/AttachmentMedia";

function mediaOf(container: HTMLElement): HTMLElement {
  return container.querySelector(
    '[data-slot="attachment-media"]',
  ) as HTMLElement;
}

/** AttachmentMedia：图标 / 图片预览槽，variant 决定裁剪与透明度。 */
describe("AttachmentMedia - variant", () => {
  it("默认 variant=icon，并把它写到 data-variant", () => {
    const { container } = render(() => <AttachmentMedia />);
    const element = mediaOf(container);

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-variant")).toBe("icon");
    expect(element.classList.contains("aspect-square")).toBe(true);
  });

  it("variant=image 时图片规则与淡出效果生效", () => {
    const { container } = render(() => (
      <AttachmentMedia variant="image">
        <img src="/a.png" alt="预览" />
      </AttachmentMedia>
    ));
    const element = mediaOf(container);

    expect(element.getAttribute("data-variant")).toBe("image");
    expect(element.classList.contains("opacity-60")).toBe(true);
    expect(element.classList.contains("[&_img]:object-cover")).toBe(true);
  });
});

describe("AttachmentMedia - 类名与属性透传", () => {
  it("合并 class 与 classList", () => {
    const { container } = render(() => (
      <AttachmentMedia class="my-media" classList={{ "is-round": true }} />
    ));
    const element = mediaOf(container);

    expect(element.classList.contains("my-media")).toBe(true);
    expect(element.classList.contains("is-round")).toBe(true);
  });

  it("透传其余属性与 children", () => {
    const { container } = render(() => (
      <AttachmentMedia aria-hidden="true">
        <span data-testid="icon" />
      </AttachmentMedia>
    ));
    const element = mediaOf(container);

    expect(element.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector('[data-testid="icon"]')).not.toBeNull();
  });
});
