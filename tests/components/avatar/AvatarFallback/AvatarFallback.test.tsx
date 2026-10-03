import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { Avatar } from "~/components/avatar/Avatar/Avatar";
import { AvatarFallback } from "~/components/avatar/AvatarFallback/AvatarFallback";
import { AvatarImage } from "~/components/avatar/AvatarImage/AvatarImage";

/**
 * AvatarFallback：图片不可用时的兜底显示。
 * 期望语义：**没有图片**或**图片加载失败**时都应显示（否则只有首字母的头像会渲染成空白）。
 */
function fallbackOf(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-slot="avatar-fallback"]');
}

describe("AvatarFallback", () => {
  it("图片加载失败后显示", () => {
    const { container } = render(() => (
      <Avatar>
        <AvatarImage src="/broken.png" />
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    ));

    expect(fallbackOf(container)).toBeNull();

    fireEvent.error(container.querySelector('[data-slot="avatar-image"]')!);

    expect(fallbackOf(container)?.textContent).toBe("AB");
  });

  it("没有图片时也应该显示（只有首字母的头像）", () => {
    const { container } = render(() => (
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    ));

    expect(fallbackOf(container)?.textContent).toBe("AB");
  });

  it("卸载图片后 fallback 重新接管（如 src 被移除）", () => {
    const [withImage, setWithImage] = createSignal(true);
    const { container } = render(() => (
      <Avatar>
        {withImage() && <AvatarImage src="/a.png" />}
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    ));

    expect(fallbackOf(container)).toBeNull();

    setWithImage(false);

    expect(fallbackOf(container)?.textContent).toBe("AB");
  });

  it("合并 class / classList 并透传其余属性", () => {
    const { container } = render(() => (
      <Avatar>
        <AvatarFallback
          class="my-fallback"
          classList={{ "is-small": true }}
          id="fb"
        >
          AB
        </AvatarFallback>
      </Avatar>
    ));
    const fallback = fallbackOf(container)!;

    expect(fallback.className).toContain("my-fallback");
    expect(fallback.className).toContain("is-small");
    expect(fallback.id).toBe("fb");
  });
});
