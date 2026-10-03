import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { EmptyMedia } from "~/components/empty/EmptyMedia/EmptyMedia";

/** EmptyMedia：空状态的图标/插图容器，variant 决定尺寸与底衬。 */
function mediaOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="empty-icon"]') as HTMLElement;
}

describe("EmptyMedia", () => {
  it("不传 variant 时 data-variant 缺省，样式仍按 default 渲染", () => {
    const { container } = render(() => <EmptyMedia />);
    const element = mediaOf(container);

    expect(element.tagName).toBe("DIV");
    // 属性只在显式传入时输出，类名走 cva 的 defaultVariants
    expect(element.hasAttribute("data-variant")).toBe(false);
    expect(element.className).not.toBe("");
  });

  it("variant=icon 时 data-variant 与样式一起变", () => {
    const plain = render(() => <EmptyMedia />);
    const icon = render(() => <EmptyMedia variant="icon" />);

    expect(mediaOf(icon.container).getAttribute("data-variant")).toBe("icon");
    // 两种变体的类名不同
    expect(mediaOf(icon.container).className).not.toBe(
      mediaOf(plain.container).className,
    );
  });

  it("合并外部 class 并透传其余属性与 children", () => {
    const { container } = render(() => (
      <EmptyMedia class="my-media" id="m">
        <svg data-testid="icon" />
      </EmptyMedia>
    ));
    const element = mediaOf(container);

    expect(element.className).toContain("my-media");
    expect(element.id).toBe("m");
    expect(container.querySelector('[data-testid="icon"]')).not.toBeNull();
  });
});
