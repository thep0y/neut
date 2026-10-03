import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import { Slider } from "~/components/slider/Slider";

/** 取根元素 */
function root(container: HTMLElement): HTMLElement {
  return container.querySelector('[data-slot="slider"]') as HTMLElement;
}

function thumbs(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll('[data-slot="slider-thumb"]'),
  ) as HTMLElement[];
}

describe("Slider", () => {
  it("默认横向渲染根节点，并写出 data-slot / data-orientation", () => {
    const { container } = render(() => <Slider defaultValue={30} />);

    expect(root(container)).toHaveAttribute("data-slot", "slider");
    expect(root(container)).toHaveAttribute("data-orientation", "horizontal");
  });

  it("orientation=vertical 时根节点写 data-orientation=vertical", () => {
    const { container } = render(() => (
      <Slider defaultValue={30} orientation="vertical" />
    ));

    expect(root(container)).toHaveAttribute("data-orientation", "vertical");
  });

  it("单值渲染 1 个 thumb，数组值渲染同等数量的 thumb", () => {
    const single = render(() => <Slider defaultValue={30} />);
    expect(thumbs(single.container)).toHaveLength(1);

    const range = render(() => <Slider defaultValue={[20, 60]} />);
    expect(thumbs(range.container)).toHaveLength(2);
  });

  it("thumb 按索引递增排列，并带上自己的 data-index", () => {
    const { container } = render(() => <Slider defaultValue={[20, 60]} />);

    expect(thumbs(container).map((el) => el.dataset.index)).toEqual(["0", "1"]);
  });

  it("组合出 control / track / indicator 三层结构", () => {
    const { container } = render(() => <Slider defaultValue={30} />);

    const track = container.querySelector(
      '[data-slot="slider-track"]',
    ) as HTMLElement;
    expect(track).not.toBeNull();
    expect(track.parentElement).toHaveAttribute(
      "data-orientation",
      "horizontal",
    );
    expect(
      container.querySelector('[data-slot="slider-range"]'),
    ).toBeInTheDocument();
  });

  it("透传 class、classList 与其余原生属性", () => {
    const { container } = render(() => (
      <Slider
        defaultValue={30}
        class="my-slider"
        classList={{ "is-active": true, "is-off": false }}
        data-testid="volume"
        aria-label="音量"
      />
    ));

    expect(root(container)).toHaveClass("my-slider");
    expect(root(container)).toHaveClass("is-active");
    expect(root(container)).not.toHaveClass("is-off");
    expect(root(container)).toHaveAttribute("data-testid", "volume");
    expect(root(container)).toHaveAttribute("aria-label", "音量");
  });
});
