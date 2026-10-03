import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { ItemMedia } from "~/components/item/ItemMedia/ItemMedia";

/** ItemMedia：条目里的图标/图片容器，variant 决定尺寸与裁剪。 */
function mediaOf(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-slot="item-media"]');
}

describe("ItemMedia", () => {
  it("默认 variant=ghost，并把它写到 data 属性", () => {
    const { container } = render(() => <ItemMedia />);
    const element = mediaOf(container)!;

    expect(element.tagName).toBe("DIV");
    expect(element.getAttribute("data-variant")).toBe("ghost");
    expect(element.className).toContain("bg-transparent");
  });

  it("variant=icon 给内联图标定尺寸", () => {
    const { container } = render(() => <ItemMedia variant="icon" />);

    expect(mediaOf(container)?.getAttribute("data-variant")).toBe("icon");
    expect(mediaOf(container)?.className).toContain("size-4");
  });

  it("variant=image 加裁剪与图片填充规则", () => {
    const { container } = render(() => <ItemMedia variant="image" />);

    expect(mediaOf(container)?.className).toContain("size-10");
    expect(mediaOf(container)?.className).toContain("[&_img]:object-cover");
  });

  it("合并 class / classList 并透传其余属性与 children", () => {
    const { container } = render(() => (
      <ItemMedia class="my-media" classList={{ "is-round": true }} id="m">
        <svg data-testid="icon" />
      </ItemMedia>
    ));
    const element = mediaOf(container)!;

    expect(element.className).toContain("my-media");
    expect(element.className).toContain("is-round");
    expect(element.id).toBe("m");
    expect(container.querySelector('[data-testid="icon"]')).not.toBeNull();
  });
});
