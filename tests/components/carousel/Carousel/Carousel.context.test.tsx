import { render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/carousel";

/**
 * 上下文约束：所有子组件都必须渲染在 <Carousel> 内部，否则抛出明确错误
 * （TESTING.md §5.3 的「上下文约束」条目）。
 */

const MESSAGE = "useCarouselContext must be used within a <Carousel />";

describe("useCarouselContext - 脱离 Carousel", () => {
  it("CarouselContent 脱离 Carousel 渲染时报错", () => {
    expect(() => render(() => <CarouselContent />)).toThrow(MESSAGE);
  });

  it("CarouselItem 脱离 Carousel 渲染时报错", () => {
    expect(() => render(() => <CarouselItem>幻灯片</CarouselItem>)).toThrow(
      MESSAGE,
    );
  });

  it("CarouselDots 脱离 Carousel 渲染时报错", () => {
    expect(() => render(() => <CarouselDots />)).toThrow(MESSAGE);
  });

  it("CarouselNext 脱离 Carousel 渲染时报错", () => {
    expect(() => render(() => <CarouselNext />)).toThrow(MESSAGE);
  });

  it("CarouselPrevious 脱离 Carousel 渲染时报错", () => {
    expect(() => render(() => <CarouselPrevious />)).toThrow(MESSAGE);
  });
});

describe("useCarouselContext - 在 Carousel 内部", () => {
  it("子组件能取得上下文并正常渲染 currentIndex", () => {
    render(() => (
      <Carousel>
        <CarouselContent>
          <CarouselItem index={0}>第一张</CarouselItem>
        </CarouselContent>
        <CarouselDots />
      </Carousel>
    ));

    expect(screen.getByRole("tab", { name: "Go to slide 1" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
