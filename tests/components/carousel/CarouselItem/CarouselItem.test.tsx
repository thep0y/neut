import { fireEvent, render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import type { Orientation } from "~/components/carousel/Carousel/Carousel.types";
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
} from "~/components/carousel";

/**
 * `CarouselItem` 渲染 slide 语义，并根据自身 index 与 currentIndex 决定 aria-hidden。
 */

function setup(
  options: { orientation?: Orientation; count?: number; class?: string } = {},
) {
  const count = options.count ?? 2;
  return render(() => (
    <Carousel orientation={options.orientation ?? "horizontal"}>
      <CarouselContent>
        {Array.from({ length: count }).map((_, index) => (
          <CarouselItem index={index} class={options.class}>
            {`第 ${index + 1} 张`}
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselDots />
    </Carousel>
  ));
}

function item(container: HTMLElement, index: number) {
  return container.querySelectorAll<HTMLElement>('[data-slot="carousel-item"]')[
    index
  ];
}

describe("CarouselItem - slide 语义", () => {
  it("fieldset 带 slide 角色描述与 data-slot", () => {
    const { container } = setup();

    const slide = item(container, 0);
    expect(slide.tagName).toBe("FIELDSET");
    expect(slide).toHaveAttribute("data-slot", "carousel-item");
    expect(slide).toHaveAttribute("aria-roledescription", "slide");
  });

  it("按 index 生成 aria-label（从 1 开始）", () => {
    const { container } = setup({ count: 3 });

    // 非当前项被 aria-hidden，不在无障碍树里，直接断言 aria-label 属性
    expect(item(container, 0)).toHaveAttribute("aria-label", "Slide 1");
    expect(item(container, 1)).toHaveAttribute("aria-label", "Slide 2");
    expect(item(container, 2)).toHaveAttribute("aria-label", "Slide 3");
  });

  it("未传 index 时使用无编号的 aria-label，且永远不是当前项", () => {
    render(() => (
      <Carousel>
        <CarouselContent>
          <CarouselItem>匿名</CarouselItem>
        </CarouselContent>
      </Carousel>
    ));

    const slide = screen.getByRole("group", { hidden: true });
    expect(slide).toHaveAttribute("aria-label", "Slide");
    expect(slide).toHaveAttribute("aria-hidden", "true");
  });
});

describe("CarouselItem - 当前项标记", () => {
  it("index 等于 currentIndex 时 aria-hidden=false，其余为 true", () => {
    const { container } = setup({ count: 3 });

    expect(item(container, 0)).toHaveAttribute("aria-hidden", "false");
    expect(item(container, 1)).toHaveAttribute("aria-hidden", "true");
    expect(item(container, 2)).toHaveAttribute("aria-hidden", "true");
  });

  it("切换索引后 aria-hidden 双向更新", () => {
    const { container } = setup({ count: 2 });

    fireEvent.click(screen.getByRole("tab", { name: "Go to slide 2" }));

    expect(item(container, 0)).toHaveAttribute("aria-hidden", "true");
    expect(item(container, 1)).toHaveAttribute("aria-hidden", "false");
  });
});

describe("CarouselItem - 方向与类名", () => {
  it("水平方向使用 pl-4 而不是 pt-4", () => {
    const { container } = setup({ orientation: "horizontal" });

    expect(item(container, 0)).toHaveClass("pl-4");
    expect(item(container, 0)).not.toHaveClass("pt-4");
  });

  it("垂直方向使用 pt-4 而不是 pl-4", () => {
    const { container } = setup({ orientation: "vertical" });

    expect(item(container, 0)).toHaveClass("pt-4");
    expect(item(container, 0)).not.toHaveClass("pl-4");
  });

  it("自定义 class 与内置类名合并", () => {
    const { container } = setup({ class: "rounded-lg" });

    expect(item(container, 0)).toHaveClass("rounded-lg", "basis-full");
  });
});
