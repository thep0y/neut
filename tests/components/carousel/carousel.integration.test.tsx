import { fireEvent, render, screen } from "@solidjs/testing-library";
import { createSignal, For } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/carousel";
import {
  stubOffsetBox,
  stubResizeObserver,
  type ResizeObserverStub,
} from "~tests/components/carousel/test-utils";

/**
 * carousel 整机行为：真实组装 Carousel + Content + Item + Dots + Next/Previous，
 * 用可手动触发的 ResizeObserver 提供尺寸（jsdom 无布局），断言导航、边界、
 * 位移与自动播放这些用户可见的结果。
 */

const selected = () =>
  screen.getAllByRole("tab").map((tab) => tab.getAttribute("aria-selected"));

/**
 * slide 用 aria-hidden 表达非当前项，被 aria-hidden 的元素不在无障碍树里，
 * 角色查询拿不到，只能按 data-slot 取（TESTING.md §5.1 的第 3 优先级）。
 */
const slideHidden = (container: HTMLElement, index: number) => {
  const slides = container.querySelectorAll('[data-slot="carousel-item"]');
  return slides[index].getAttribute("aria-hidden");
};

function queryTrack(container: HTMLElement) {
  const viewport = container.querySelector<HTMLElement>(
    '[data-slot="carousel-content"]',
  ) as HTMLElement;
  return viewport.firstElementChild as HTMLElement;
}

/** jsdom 恒为 0：显式给 item / viewport 造尺寸并触发一次重新测量 */
function applyLayout(
  resizeObserver: ResizeObserverStub,
  container: HTMLElement,
  layout: {
    itemWidth?: number;
    itemHeight?: number;
    viewportWidth?: number;
    viewportHeight?: number;
  },
) {
  const viewport = container.querySelector<HTMLElement>(
    '[data-slot="carousel-content"]',
  ) as HTMLElement;
  const item = viewport.firstElementChild?.firstElementChild as HTMLElement;
  stubOffsetBox(item, { width: layout.itemWidth, height: layout.itemHeight });
  stubOffsetBox(viewport, {
    width: layout.viewportWidth,
    height: layout.viewportHeight,
  });
  resizeObserver.triggerAll();
}

function CarouselFixture(props: {
  orientation?: "horizontal" | "vertical";
  loop?: boolean;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  count?: number;
}) {
  const count = props.count ?? 3;
  return (
    <Carousel
      orientation={props.orientation}
      loop={props.loop}
      autoPlay={props.autoPlay}
      autoPlayInterval={props.autoPlayInterval}
    >
      <CarouselContent>
        <For each={Array.from({ length: count })}>
          {(_, index) => (
            <CarouselItem
              index={index()}
            >{`第 ${index() + 1} 张`}</CarouselItem>
          )}
        </For>
      </CarouselContent>
      <CarouselDots />
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

describe("carousel 整机 - 水平导航", () => {
  it("点击下一张/上一张同步索引、dots、slide aria-hidden 与 track 位移", () => {
    const resizeObserver = stubResizeObserver();
    const { container } = render(() => <CarouselFixture count={3} />);
    applyLayout(resizeObserver, container, {
      itemWidth: 200,
      viewportWidth: 200,
    });

    expect(slideHidden(container, 0)).toBe("false");
    expect(slideHidden(container, 1)).toBe("true");
    expect(queryTrack(container).getAttribute("style")).toBe(
      "transform: translate3d(-0px, 0, 0);",
    );

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));

    expect(selected()).toEqual(["false", "true", "false"]);
    expect(slideHidden(container, 0)).toBe("true");
    expect(slideHidden(container, 1)).toBe("false");
    expect(queryTrack(container).getAttribute("style")).toBe(
      "transform: translate3d(-200px, 0, 0);",
    );

    fireEvent.click(screen.getByRole("button", { name: "Previous slide" }));

    expect(selected()).toEqual(["true", "false", "false"]);
    expect(queryTrack(container).getAttribute("style")).toBe(
      "transform: translate3d(-0px, 0, 0);",
    );
  });

  it("一屏可见多个时，只有走到最后一个可见组合才禁用下一张", () => {
    const resizeObserver = stubResizeObserver();
    const { container } = render(() => <CarouselFixture count={5} />);
    // item 200 / viewport 600 -> 一屏 3 个
    applyLayout(resizeObserver, container, {
      itemWidth: 200,
      viewportWidth: 600,
    });

    const next = screen.getByRole("button", { name: "Next slide" });
    expect(next).toBeEnabled();

    fireEvent.click(next);
    expect(next).toBeEnabled();

    fireEvent.click(next);
    expect(selected()).toEqual(["false", "false", "true", "false", "false"]);
    expect(next).toBeDisabled();
  });
});

describe("carousel 整机 - 垂直导航", () => {
  it("垂直方向位移走 Y 轴", () => {
    const resizeObserver = stubResizeObserver();
    const { container } = render(() => (
      <CarouselFixture orientation="vertical" count={3} />
    ));
    applyLayout(resizeObserver, container, {
      itemHeight: 150,
      viewportHeight: 150,
    });

    fireEvent.click(screen.getByRole("button", { name: "Next slide" }));

    expect(queryTrack(container).getAttribute("style")).toBe(
      "transform: translate3d(0, -150px, 0);",
    );
    expect(selected()).toEqual(["false", "true", "false"]);
  });
});

describe("carousel 整机 - 循环", () => {
  it("loop=true 时连续下一张会从末项回到首项", () => {
    render(() => <CarouselFixture count={3} loop />);
    const next = screen.getByRole("button", { name: "Next slide" });

    fireEvent.click(next);
    fireEvent.click(next);
    expect(selected()).toEqual(["false", "false", "true"]);

    fireEvent.click(next);
    expect(selected()).toEqual(["true", "false", "false"]);
  });
});

describe("carousel 整机 - 自动播放", () => {
  it("autoPlay 未显式指定间隔时按 3000ms 推进，卸载后停止", () => {
    vi.useFakeTimers();
    const { unmount } = render(() => <CarouselFixture autoPlay count={3} />);

    vi.advanceTimersByTime(2999);
    expect(selected()).toEqual(["true", "false", "false"]);

    vi.advanceTimersByTime(1);
    expect(selected()).toEqual(["false", "true", "false"]);

    unmount();
    vi.advanceTimersByTime(10_000);
    // 卸载后不再有 DOM 可断言；用 mock 的定时器剩余数量间接确认已清理
    expect(vi.getTimerCount()).toBe(0);
  });

  it("autoPlayInterval 生效", () => {
    vi.useFakeTimers();
    render(() => <CarouselFixture autoPlay autoPlayInterval={500} count={3} />);

    vi.advanceTimersByTime(500);
    expect(selected()).toEqual(["false", "true", "false"]);
  });
});

describe("carousel 整机 - 动态 item", () => {
  it("增删 item 时 dots 数量与边界随之变化", () => {
    const [count, setCount] = createSignal(2);
    const { unmount } = render(() => (
      <Carousel loop={false}>
        <CarouselContent>
          <For each={Array.from({ length: count() })}>
            {(_, index) => (
              <CarouselItem
                index={index()}
              >{`第 ${index() + 1} 张`}</CarouselItem>
            )}
          </For>
        </CarouselContent>
        <CarouselDots />
        <CarouselNext />
      </Carousel>
    ));

    expect(screen.getAllByRole("tab")).toHaveLength(2);

    setCount(3);
    expect(screen.getAllByRole("tab")).toHaveLength(3);

    setCount(1);
    expect(screen.getAllByRole("tab")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Next slide" })).toBeDisabled();

    unmount();
  });
});

/**
 * 键盘导航（回归）。
 *
 * 此前 `Carousel` 把调用时仍为 `undefined` 的 `rootRef` **按值**传给
 * `useKeyboardNavigation`，之后 ref 被赋值也不会回填，`createEffect` 又不依赖
 * 任何 signal，于是根元素上根本没有 keydown 监听——键盘导航完全失效。
 * 现在 ref 是 signal（Accessor），监听器在挂载后补挂上。
 */
describe("carousel 整机 - 键盘导航", () => {
  it("方向键翻页：ArrowRight 到第二张、ArrowLeft 回到第一张", () => {
    const { container } = render(() => <CarouselFixture count={3} />);
    const root = container.querySelector<HTMLElement>(
      '[data-slot="carousel"]',
    ) as HTMLElement;

    expect(fireEvent.keyDown(root, { key: "ArrowRight" })).toBe(false);
    expect(selected()).toEqual(["false", "true", "false"]);

    expect(fireEvent.keyDown(root, { key: "ArrowLeft" })).toBe(false);
    expect(selected()).toEqual(["true", "false", "false"]);
  });

  it("Home / End 跳到首尾", () => {
    const { container } = render(() => <CarouselFixture count={3} />);
    const root = container.querySelector<HTMLElement>(
      '[data-slot="carousel"]',
    ) as HTMLElement;

    fireEvent.keyDown(root, { key: "End" });
    expect(selected()).toEqual(["false", "false", "true"]);

    fireEvent.keyDown(root, { key: "Home" });
    expect(selected()).toEqual(["true", "false", "false"]);
  });

  it("无关按键不翻页、也不阻止默认行为", () => {
    const { container } = render(() => <CarouselFixture count={3} />);
    const root = container.querySelector<HTMLElement>(
      '[data-slot="carousel"]',
    ) as HTMLElement;

    expect(fireEvent.keyDown(root, { key: "a" })).toBe(true);
    expect(selected()).toEqual(["true", "false", "false"]);
  });
});
