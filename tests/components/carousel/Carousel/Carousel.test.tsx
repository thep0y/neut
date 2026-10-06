import { fireEvent, render, screen } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
} from "~/components/carousel";

/** 根组件只负责组装：ARIA、类名、透传属性与 options 注入 Provider */
function setup(props: {
  "aria-label"?: string;
  class?: string;
  id?: string;
  loop?: boolean;
  orientation?: "horizontal" | "vertical";
  onKeyDown?: (event: KeyboardEvent) => void;
}) {
  return render(() => (
    <Carousel {...props}>
      <CarouselContent>
        <CarouselItem index={0}>幻灯片</CarouselItem>
      </CarouselContent>
      <CarouselPrevious />
    </Carousel>
  ));
}

describe("Carousel - ARIA 与结构", () => {
  it("根元素是 carousel 语义的 region", () => {
    setup({});

    const root = screen.getByRole("region", { name: "Carousel" });

    expect(root).toHaveAttribute("data-slot", "carousel");
    expect(root).toHaveAttribute("aria-roledescription", "carousel");
    expect(root.tagName).toBe("SECTION");
  });

  it("未传 aria-label 时回退到 Carousel", () => {
    setup({});

    expect(screen.getByRole("region")).toHaveAccessibleName("Carousel");
  });

  it("传入 aria-label 时覆盖默认值", () => {
    setup({ "aria-label": "商品图库" });

    expect(screen.getByRole("region")).toHaveAccessibleName("商品图库");
    expect(screen.queryByRole("region", { name: "Carousel" })).toBeNull();
  });

  it("渲染 children（Content / Item 均在根内部）", () => {
    const { container } = setup({});

    expect(
      container.querySelector('[data-slot="carousel-content"]'),
    ).not.toBeNull();
    expect(
      container.querySelector('[data-slot="carousel-item"]'),
    ).toHaveTextContent("幻灯片");
  });
});

describe("Carousel - 类名与属性透传", () => {
  it("内置 relative 与自定义 class 合并", () => {
    setup({ class: "my-carousel" });

    expect(screen.getByRole("region")).toHaveAttribute(
      "class",
      "relative my-carousel",
    );
  });

  it("不传 class 时只保留内置类名", () => {
    setup({});

    expect(screen.getByRole("region")).toHaveAttribute("class", "relative");
  });

  it("其余属性透传到根元素，且用户 onKeyDown 不被内部键盘监听吞掉", () => {
    const onKeyDown = vi.fn();
    setup({ id: "hero-carousel", onKeyDown });

    const root = screen.getByRole("region");
    expect(root).toHaveAttribute("id", "hero-carousel");

    fireEvent.keyDown(root, { key: "ArrowRight" });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });
});

describe("Carousel - options 注入子组件", () => {
  it("loop 默认 false：首项时上一张按钮禁用", () => {
    setup({});

    expect(
      screen.getByRole("button", { name: "Previous slide" }),
    ).toBeDisabled();
  });

  it("loop=true 时首项也能上一张", () => {
    setup({ loop: true });

    expect(
      screen.getByRole("button", { name: "Previous slide" }),
    ).toBeEnabled();
  });
});
