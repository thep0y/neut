import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Avatar } from "~/components/avatar/Avatar/Avatar";
import { AvatarFallback } from "~/components/avatar/AvatarFallback/AvatarFallback";
import { AvatarImage } from "~/components/avatar/AvatarImage/AvatarImage";

/**
 * AvatarImage：图片加载失败时把自己从 DOM 移除（由 AvatarFallback 接管），
 * 也就是"图片能加载就显示图片，加载失败显示 fallback"。
 */
function imageOf(container: HTMLElement): HTMLImageElement | null {
  return container.querySelector('[data-slot="avatar-image"]');
}

describe("AvatarImage", () => {
  it("默认渲染 img，alt 缺省时用 Avatar Image", () => {
    const { container } = render(() => (
      <Avatar>
        <AvatarImage src="/a.png" />
      </Avatar>
    ));
    const image = imageOf(container)!;

    expect(image.tagName).toBe("IMG");
    expect(image.getAttribute("alt")).toBe("Avatar Image");
    expect(image.getAttribute("src")).toBe("/a.png");
  });

  it("alt 可覆盖，class / classList 合并", () => {
    const { container } = render(() => (
      <Avatar>
        <AvatarImage
          src="/a.png"
          alt="头像"
          class="my-img"
          classList={{ "is-square": true }}
        />
      </Avatar>
    ));
    const image = imageOf(container)!;

    expect(image.getAttribute("alt")).toBe("头像");
    expect(image.className).toContain("my-img");
    expect(image.className).toContain("is-square");
  });

  it("加载失败后移除图片并显示 fallback", () => {
    const { container } = render(() => (
      <Avatar>
        <AvatarImage src="/broken.png" alt="头像" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    ));

    expect(imageOf(container)).not.toBeNull();

    fireEvent.error(imageOf(container)!);

    expect(imageOf(container)).toBeNull();
    expect(
      container.querySelector('[data-slot="avatar-fallback"]')?.textContent,
    ).toBe("AB");
  });

  it("图片存在期间 fallback 让位（不渲染）", () => {
    const { container } = render(() => (
      <Avatar>
        <AvatarImage src="/a.png" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    ));

    expect(container.querySelector('[data-slot="avatar-fallback"]')).toBeNull();
  });

  it("透传其余属性", () => {
    const { container } = render(() => (
      <Avatar>
        <AvatarImage src="/a.png" loading="lazy" data-custom="1" />
      </Avatar>
    ));
    const image = imageOf(container)!;

    expect(image.getAttribute("loading")).toBe("lazy");
    expect(image.getAttribute("data-custom")).toBe("1");
  });
});
