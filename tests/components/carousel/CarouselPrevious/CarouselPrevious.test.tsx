import { fireEvent, render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import type { Orientation } from "~/components/carousel/Carousel/Carousel.types";
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselPrevious,
} from "~/components/carousel";

/** `CarouselPrevious`：位置类名随方向切换，禁用态由 canScrollPrev 决定 */

function setup(
  options: {
    orientation?: Orientation;
    count?: number;
    loop?: boolean;
    class?: string;
    classList?: Record<string, boolean | undefined>;
    onClick?: unknown;
    "aria-label"?: string;
  } = {},
) {
  const count = options.count ?? 3;
  return render(() => (
    <Carousel
      orientation={options.orientation ?? "horizontal"}
      loop={options.loop ?? false}
    >
      <CarouselContent>
        {Array.from({ length: count }).map((_, index) => (
          <CarouselItem index={index}>{`第 ${index + 1} 张`}</CarouselItem>
        ))}
      </CarouselContent>
      <CarouselDots />
      <CarouselPrevious
        class={options.class}
        classList={options.classList}
        onClick={options.onClick as never}
        aria-label={options["aria-label"]}
      />
    </Carousel>
  ));
}

const previous = () => screen.getByRole("button", { name: "Previous slide" });
const selected = () =>
  screen.getAllByRole("tab").map((tab) => tab.getAttribute("aria-selected"));
const root = () =>
  document.querySelector('[data-slot="carousel"]') as HTMLElement;

describe("CarouselPrevious - 语义与方向类名", () => {
  it("是名为 Previous slide 的 carousel-previous 按钮", () => {
    setup();

    expect(previous()).toHaveAttribute("data-slot", "carousel-previous");
  });

  it("水平方向使用左侧居中定位与 active 位移修正", () => {
    setup({ orientation: "horizontal" });
    fireEvent.click(screen.getByRole("tab", { name: "Go to slide 2" }));

    expect(previous()).toHaveClass("top-1/2", "-left-12", "-translate-y-1/2");
    expect(previous()).toHaveClass(
      "active:data-[slot=carousel-previous]:translate-y-[calc(-50%+1px)]",
    );
    expect(previous()).not.toHaveClass("-top-12");
  });

  it("垂直方向使用顶部居中定位并旋转图标", () => {
    setup({ orientation: "vertical" });
    fireEvent.click(screen.getByRole("tab", { name: "Go to slide 2" }));

    expect(previous()).toHaveClass(
      "-top-12",
      "left-1/2",
      "-translate-x-1/2",
      "rotate-90",
    );
    expect(previous()).not.toHaveClass("-left-12");
    expect(previous()).not.toHaveClass(
      "active:data-[slot=carousel-previous]:translate-y-[calc(-50%+1px)]",
    );
  });

  it("自定义 class 与 classList 都生效", () => {
    setup({
      class: "text-lg",
      classList: { "opacity-50": true, hidden: false },
    });

    expect(previous()).toHaveClass("text-lg", "opacity-50", "rounded-full");
    expect(previous()).not.toHaveClass("hidden");
  });
});

describe("CarouselPrevious - 行为与边界", () => {
  it("点击后后退一项", () => {
    setup({ count: 3 });
    fireEvent.click(screen.getByRole("tab", { name: "Go to slide 3" }));

    fireEvent.click(previous());

    expect(selected()).toEqual(["false", "true", "false"]);
  });

  it("非循环时第一项禁用", () => {
    setup({ count: 3 });

    expect(previous()).toBeDisabled();
  });

  it("循环时第一项仍可用，点击回到最后一项", () => {
    setup({ count: 3, loop: true });

    expect(previous()).toBeEnabled();

    fireEvent.click(previous());
    expect(selected()).toEqual(["false", "false", "true"]);
  });
});

describe("CarouselPrevious - 用户 onClick（回归）", () => {
  it("既调用用户的 onClick，也执行内部翻页", () => {
    let clicked = 0;
    setup({ onClick: () => (clicked += 1) });
    // 第一张时"上一张"是禁用的，先让根元素的键盘导航把它挪到第二张
    fireEvent.keyDown(root(), { key: "ArrowRight" });
    expect(selected()).toEqual(["false", "true", "false"]);

    fireEvent.click(previous());

    expect(clicked).toBe(1);
    expect(selected()).toEqual(["true", "false", "false"]);
  });

  it("用户的 onClick 不会被内部实现替换掉", () => {
    const seen: unknown[] = [];
    setup({
      onClick: [(data: unknown) => seen.push(data), { reason: "previous" }],
    });
    fireEvent.keyDown(root(), { key: "ArrowRight" });

    fireEvent.click(previous());

    expect(seen).toEqual([{ reason: "previous" }]);
    expect(selected()).toEqual(["true", "false", "false"]);
  });

  it("用户在 onClick 里 preventDefault 时不再翻页", () => {
    setup({ onClick: (event: MouseEvent) => event.preventDefault() });
    fireEvent.keyDown(root(), { key: "ArrowRight" });
    expect(selected()).toEqual(["false", "true", "false"]);

    fireEvent.click(previous());

    // preventDefault 之后内部 scrollPrev 不应执行，仍停在第二张
    expect(selected()).toEqual(["false", "true", "false"]);
  });

  it("用户传 aria-label 时不再被内置文案覆盖", () => {
    setup({ "aria-label": "自定义上一张" });

    const button = document.querySelector(
      '[data-slot="carousel-previous"]',
    ) as HTMLElement;
    expect(button.getAttribute("aria-label")).toBe("自定义上一张");
  });
});
