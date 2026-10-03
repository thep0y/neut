import { fireEvent, render, screen } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
} from "~/components/carousel";

/** `CarouselDots`：按 itemCount 生成 tab，点击跳转，当前项用 aria-selected 表达 */

function setup(options: { count?: number; class?: string } = {}) {
  const count = options.count ?? 3;
  return render(() => (
    <Carousel>
      <CarouselContent>
        {Array.from({ length: count }).map((_, index) => (
          <CarouselItem index={index}>{`第 ${index + 1} 张`}</CarouselItem>
        ))}
      </CarouselContent>
      <CarouselDots class={options.class} />
    </Carousel>
  ));
}

const selected = () =>
  screen.getAllByRole("tab").map((tab) => tab.getAttribute("aria-selected"));

describe("CarouselDots - 渲染", () => {
  it("渲染 tablist，每个 item 一个 tab 并带编号 aria-label", () => {
    setup({ count: 3 });

    expect(
      screen.getByRole("tablist", { name: "Slide navigation" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
    expect(
      screen.getByRole("tab", { name: "Go to slide 2" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Go to slide 3" }),
    ).toBeInTheDocument();
  });

  it("没有 item 时不渲染任何 tab", () => {
    setup({ count: 0 });

    expect(screen.queryAllByRole("tab")).toHaveLength(0);
  });

  it("自定义 class 追加到内置类名之后", () => {
    setup({ count: 1, class: "gap-4" });

    const tablist = screen.getByRole("tablist");
    expect(tablist).toHaveClass(
      "flex",
      "items-center",
      "justify-center",
      "gap-4",
    );
  });
});

describe("CarouselDots - 当前态与跳转", () => {
  it("初始只有第一个 tab 是选中态", () => {
    setup({ count: 3 });

    expect(selected()).toEqual(["true", "false", "false"]);
  });

  it("点击某个 tab 跳转到对应项，并同步 aria-selected", () => {
    setup({ count: 3 });

    fireEvent.click(screen.getByRole("tab", { name: "Go to slide 3" }));

    expect(selected()).toEqual(["false", "false", "true"]);
  });
});
