import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { AspectRatio } from "~/components/aspect-ratio/AspectRatio";

/** AspectRatio：用 `--ratio` 自定义属性驱动宽高比。 */
function ratioOf(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="aspect-ratio"]') as HTMLElement;
}

describe("AspectRatio", () => {
  it("把 ratio 写成 --ratio 自定义属性", () => {
    const { container } = render(() => <AspectRatio ratio={16 / 9} />);

    expect(ratioOf(container).style.getPropertyValue("--ratio")).toBe(
      String(16 / 9),
    );
  });

  it("ratio 是必填 prop，不同取值都如实写入", () => {
    // 类型上 `ratio` 必填（BaseAspectRatioProps.ratio），没有默认值
    const { container } = render(() => <AspectRatio ratio={1} />);

    expect(ratioOf(container).style.getPropertyValue("--ratio")).toBe("1");
  });

  it("渲染 children", () => {
    const { container } = render(() => (
      <AspectRatio ratio={4 / 3}>
        <img src="/a.png" alt="图" />
      </AspectRatio>
    ));

    expect(ratioOf(container).querySelector("img")).not.toBeNull();
  });

  it("合并 class 与 classList 并透传其余属性", () => {
    const { container } = render(() => (
      <AspectRatio
        ratio={16 / 9}
        class="my-ratio"
        classList={{ "is-wide": true }}
        id="r"
      />
    ));
    const el = ratioOf(container);

    expect(el.className).toContain("my-ratio");
    expect(el.className).toContain("is-wide");
    expect(el.id).toBe("r");
  });
});
