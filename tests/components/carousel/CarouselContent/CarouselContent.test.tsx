import { render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import type { Orientation } from "~/components/carousel/Carousel/Carousel.types";
import { Carousel, CarouselContent, CarouselItem } from "~/components/carousel";

/**
 * `CarouselContent` 是两层结构：viewport（overflow:hidden + aria-live）
 * 与 track（transform 位移）。方向、类名、classList 与透传属性都在 track 上。
 */

function setup(
  options: {
    orientation?: Orientation;
    class?: string;
    classList?: Record<string, boolean | undefined>;
  } = {},
) {
  return render(() => (
    <Carousel orientation={options.orientation ?? "horizontal"}>
      <CarouselContent
        class={options.class}
        classList={options.classList}
        data-testid="track"
      >
        <CarouselItem index={0}>A</CarouselItem>
      </CarouselContent>
    </Carousel>
  ));
}

function getViewport(container: HTMLElement) {
  return container.querySelector<HTMLElement>(
    '[data-slot="carousel-content"]',
  ) as HTMLElement;
}

describe("CarouselContent - viewport", () => {
  it("渲染带 aria-live 的 overflow:hidden 容器", () => {
    const { container } = setup();

    const viewport = getViewport(container);
    expect(viewport).toHaveAttribute("aria-live", "polite");
    expect(viewport).toHaveAttribute("aria-atomic", "true");
    expect(viewport).toHaveClass("overflow-hidden");
  });
});

describe("CarouselContent - 方向", () => {
  it("水平方向使用 -ml-4 且不加 flex-col", () => {
    const { container } = setup({ orientation: "horizontal" });

    const track = getViewport(container).firstElementChild as HTMLElement;
    expect(track).toHaveClass(
      "flex",
      "transition-transform",
      "duration-500",
      "ease-out",
      "-ml-4",
    );
    expect(track).not.toHaveClass("-mt-4");
    expect(track).not.toHaveClass("flex-col");
    expect(track.getAttribute("style")).toBe(
      "transform: translate3d(-0px, 0, 0);",
    );
  });

  it("垂直方向使用 -mt-4 flex-col 且不加 -ml-4", () => {
    const { container } = setup({ orientation: "vertical" });

    const track = getViewport(container).firstElementChild as HTMLElement;
    expect(track).toHaveClass("-mt-4", "flex-col");
    expect(track).not.toHaveClass("-ml-4");
    expect(track.getAttribute("style")).toBe(
      "transform: translate3d(0, -0px, 0);",
    );
  });
});

describe("CarouselContent - 类名与属性透传", () => {
  it("自定义 class 追加到 track 的内置类名之后", () => {
    const { container } = setup({ class: "gap-2" });

    const track = getViewport(container).firstElementChild as HTMLElement;
    expect(track).toHaveClass("gap-2", "-ml-4");
  });

  it("classList 生效：为 true 的键加入，false 的键不加入", () => {
    const { container } = setup({
      classList: { "bg-red-500": true, hidden: false },
    });

    const track = getViewport(container).firstElementChild as HTMLElement;
    expect(track).toHaveClass("bg-red-500");
    expect(track).not.toHaveClass("hidden");
  });

  it("其余属性透传到 track", () => {
    const { container } = setup();

    const track = getViewport(container).firstElementChild as HTMLElement;
    expect(track).toHaveAttribute("data-testid", "track");
  });
});

describe("CarouselContent - 用户 style（回归）", () => {
  it("用户 style 与内部 transform 合并，而不是覆盖掉 transform", () => {
    const { container } = render(() => (
      <Carousel>
        <CarouselContent style={{ color: "red" }}>
          <CarouselItem index={0}>1</CarouselItem>
        </CarouselContent>
      </Carousel>
    ));
    const track = container.querySelector<HTMLElement>(
      '[data-slot="carousel-content"]',
    )!.firstElementChild as HTMLElement;

    // 此前整份 style 被用户值替换，轮播因此完全不再位移
    expect(track.style.transform).toContain("translate3d");
    expect(track.style.color).toBe("red");
  });
});
