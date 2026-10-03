import { fireEvent, render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import type { Orientation } from "~/components/carousel/Carousel/Carousel.types";
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
} from "~/components/carousel";

/** `CarouselNext`：位置类名随方向切换，禁用态由 canScrollNext 决定 */

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
      <CarouselNext
        class={options.class}
        classList={options.classList}
        onClick={options.onClick as never}
        aria-label={options["aria-label"]}
      />
    </Carousel>
  ));
}

const next = () =>
  document.querySelector('[data-slot="carousel-next"]') as HTMLButtonElement;

/** 当前选中的 dot 下标（-1 表示没有）；dots 用 role="tab" 表达 */
const activeDot = () =>
  Array.from(document.querySelectorAll('[role="tab"]')).findIndex(
    (dot) => dot.getAttribute("aria-selected") === "true",
  );
const selected = () =>
  screen.getAllByRole("tab").map((tab) => tab.getAttribute("aria-selected"));

describe("CarouselNext - 语义与方向类名", () => {
  it("是名为 Next slide 的 carousel-next 按钮", () => {
    setup();

    expect(next()).toHaveAttribute("data-slot", "carousel-next");
    expect(next()).toBeEnabled();
  });

  it("水平方向使用右侧居中定位与 active 位移修正", () => {
    setup({ orientation: "horizontal" });

    expect(next()).toHaveClass("top-1/2", "-right-12", "-translate-y-1/2");
    expect(next()).toHaveClass(
      "active:data-[slot=carousel-next]:translate-y-[calc(-50%+1px)]",
    );
    expect(next()).not.toHaveClass("-bottom-12");
  });

  it("垂直方向使用底部居中定位并旋转图标", () => {
    setup({ orientation: "vertical" });

    expect(next()).toHaveClass(
      "-bottom-12",
      "left-1/2",
      "-translate-x-1/2",
      "rotate-90",
    );
    expect(next()).not.toHaveClass("-right-12");
    expect(next()).not.toHaveClass(
      "active:data-[slot=carousel-next]:translate-y-[calc(-50%+1px)]",
    );
  });

  it("自定义 class 与 classList 都生效", () => {
    setup({
      class: "text-lg",
      classList: { "opacity-50": true, hidden: false },
    });

    expect(next()).toHaveClass("text-lg", "opacity-50", "rounded-full");
    expect(next()).not.toHaveClass("hidden");
  });
});

describe("CarouselNext - 行为与边界", () => {
  it("点击后前进一项", () => {
    setup({ count: 3 });

    fireEvent.click(next());

    expect(selected()).toEqual(["false", "true", "false"]);
  });

  it("非循环时最后一项禁用", () => {
    setup({ count: 3 });
    fireEvent.click(screen.getByRole("tab", { name: "Go to slide 3" }));

    expect(next()).toBeDisabled();
  });

  it("循环时最后一项仍可用，点击回到第一项", () => {
    setup({ count: 3, loop: true });
    fireEvent.click(screen.getByRole("tab", { name: "Go to slide 3" }));

    expect(next()).toBeEnabled();

    fireEvent.click(next());
    expect(selected()).toEqual(["true", "false", "false"]);
  });
});

describe("CarouselNext - 用户 onClick（回归）", () => {
  it("既调用用户的 onClick，也执行内部翻页", () => {
    let clicked = 0;
    setup({ onClick: () => (clicked += 1) });

    fireEvent.click(next());

    expect(clicked).toBe(1);
    expect(activeDot()).toBe(1);
  });

  it("用户在 onClick 里 preventDefault 时不再翻页", () => {
    setup({ onClick: (event: MouseEvent) => event.preventDefault() });

    fireEvent.click(next());

    expect(activeDot()).toBe(0);
  });

  it("支持 Solid 的 [handler, data] 形式", () => {
    const seen: unknown[] = [];
    setup({
      onClick: [(data: unknown) => seen.push(data), { reason: "test" }],
    });

    fireEvent.click(next());

    expect(seen).toEqual([{ reason: "test" }]);
    expect(activeDot()).toBe(1);
  });

  it("用户传 aria-label 时不再被内置文案覆盖", () => {
    setup({ "aria-label": "自定义下一张" });

    expect(next().getAttribute("aria-label")).toBe("自定义下一张");
  });
});
