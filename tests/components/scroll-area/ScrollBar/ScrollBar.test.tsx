import { fireEvent, render } from "@solidjs/testing-library";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScrollArea } from "~/components/scroll-area/ScrollArea";
import { ScrollAreaContext } from "~/components/scroll-area/ScrollArea/ScrollArea.context";
import { ScrollBar } from "~/components/scroll-area/ScrollBar/ScrollBar";

/**
 * ScrollBar 与 ScrollArea 的组合行为测试。
 *
 * jsdom 不做布局（所有矩形/尺寸恒为 0），因此这里显式 stub viewport 的
 * 滚动尺寸与 track 的 `getBoundingClientRect`，用一个「可控坐标系」驱动交互
 *（TESTING.md §4.5：只 mock 系统边界）。
 */

/** 让元素报告指定尺寸（jsdom 的属性只有 getter） */
function setMetrics(
  el: HTMLElement,
  size: {
    clientHeight?: number;
    scrollHeight?: number;
    clientWidth?: number;
    scrollWidth?: number;
  },
) {
  for (const [key, value] of Object.entries(size)) {
    Object.defineProperty(el, key, { configurable: true, value });
  }
}

/** 让元素报告指定矩形 */
function measure(
  el: HTMLElement,
  rect: { top: number; left: number; height: number; width: number },
) {
  el.getBoundingClientRect = () =>
    ({
      ...rect,
      bottom: rect.top + rect.height,
      right: rect.left + rect.width,
      x: rect.left,
      y: rect.top,
      toJSON: () => ({}),
    }) as DOMRect;
}

/** 渲染一个 ScrollArea，并把展开后的关键元素交给用例 */
function setup(
  options: { scrollBarOrientation?: "vertical" | "horizontal" } = {},
) {
  const view = render(() => (
    <ScrollArea
      orientation={options.scrollBarOrientation ?? "vertical"}
      aria-label="测试区域"
    >
      <div>很长的内容</div>
    </ScrollArea>
  ));

  const viewport = document.querySelector(
    '[data-slot="scroll-area-viewport"]',
  ) as HTMLElement;
  const scrollBar = document.querySelector(
    '[data-slot="scroll-area-scrollbar"]',
  ) as HTMLElement;
  const thumb = document.querySelector(
    '[data-slot="scroll-area-thumb"]',
  ) as HTMLElement;

  // 内容高 1000 / 视口高 400 → 可滚动 600
  setMetrics(viewport, {
    clientHeight: 400,
    scrollHeight: 1000,
    clientWidth: 300,
    scrollWidth: 300,
  });
  // track 高 402（含 2px 内边距），滑块高 100
  setMetrics(scrollBar, { clientHeight: 402, clientWidth: 100 });
  setMetrics(thumb, { clientHeight: 100, clientWidth: 20 });

  const scrollTo = vi.fn();
  viewport.scrollTo = scrollTo as unknown as HTMLElement["scrollTo"];

  return {
    ...view,
    viewport,
    scrollBar,
    thumb,
    scrollTo,
  };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ScrollBar - 渲染与 ARIA", () => {
  it("track 暴露为 scrollbar widget 并关联视口", () => {
    const { scrollBar } = setup();

    expect(scrollBar).toHaveAttribute("role", "scrollbar");
    expect(scrollBar).toHaveAttribute("aria-controls", "scroll-area-viewport");
    expect(scrollBar).toHaveAttribute("aria-orientation", "vertical");
  });

  it("aria-valuemin / max 固定为 0 / 100", () => {
    const { scrollBar } = setup();

    expect(scrollBar).toHaveAttribute("aria-valuemin", "0");
    expect(scrollBar).toHaveAttribute("aria-valuemax", "100");
  });

  it("track 可聚焦且带 data-orientation", () => {
    const { scrollBar } = setup();

    expect(scrollBar).toHaveAttribute("tabindex", "0");
    expect(scrollBar).toHaveAttribute("data-orientation", "vertical");
  });

  it("默认不可见（opacity-0），悬停容器后可见", () => {
    const { container } = setup();

    const area = container.querySelector(
      '[data-slot="scroll-area"]',
    ) as HTMLElement;
    const track = container.querySelector(
      '[data-slot="scroll-area-scrollbar"]',
    ) as HTMLElement;

    expect(track.className).toContain("opacity-0");

    fireEvent.mouseEnter(area);

    expect(track.className).toContain("opacity-100");
  });

  it("横向 orientation 透传到 track 与滑块", () => {
    const { scrollBar, thumb } = setup({ scrollBarOrientation: "horizontal" });

    expect(scrollBar).toHaveAttribute("data-orientation", "horizontal");
    expect(thumb).toHaveAttribute("data-orientation", "horizontal");
  });
});

describe("ScrollBar - 拖动滑块", () => {
  it("向下拖动按比例写入 scrollTop", () => {
    const { viewport, thumb } = setup();

    // 比例 = maxScroll / (trackInner - thumb) = 600 / (400 - 100) = 2
    fireEvent.pointerDown(thumb, { clientY: 0 });
    fireEvent.pointerMove(window, { clientY: 50 });

    expect(viewport.scrollTop).toBe(100);
  });

  it("拖到区间外时滚动位置夹在 [0, maxScroll]", () => {
    const { viewport, thumb } = setup();

    fireEvent.pointerDown(thumb, { clientY: 0 });
    fireEvent.pointerMove(window, { clientY: -500 });
    expect(viewport.scrollTop).toBe(0);

    fireEvent.pointerMove(window, { clientY: 5000 });
    expect(viewport.scrollTop).toBe(600);
  });

  it("pointerdown 阻止默认行为与冒泡（不触发 track 点击滚动）", () => {
    const { scrollTo, thumb } = setup();

    const event = new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      clientY: 0,
    });
    const stopSpy = vi.spyOn(event, "stopPropagation");
    thumb.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(stopSpy).toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("pointerup 后拖动结束，再移动不再跟随", () => {
    const { viewport, thumb } = setup();

    fireEvent.pointerDown(thumb, { clientY: 0 });
    fireEvent.pointerMove(window, { clientY: 50 });
    expect(viewport.scrollTop).toBe(100);

    fireEvent.pointerUp(window);
    fireEvent.pointerMove(window, { clientY: 200 });

    expect(viewport.scrollTop).toBe(100);
  });

  it("拖动时滑块进入 active 高亮态，松开后恢复", () => {
    const { thumb } = setup();

    expect(thumb.className).not.toContain("bg-neutral-500");

    fireEvent.pointerDown(thumb, { clientY: 0 });
    expect(thumb.className).toContain("bg-neutral-500");

    fireEvent.pointerUp(window);
    expect(thumb.className).not.toContain("bg-neutral-500");
  });
});

describe("ScrollBar - 点击 track", () => {
  it("点击 track 空白按点击比例平滑滚动", () => {
    const { scrollBar, scrollTo } = setup();
    measure(scrollBar, { top: 100, left: 0, height: 200, width: 20 });

    fireEvent.pointerDown(scrollBar, { clientY: 200 });

    // (200 - 100) / 200 = 0.5 → 0.5 * 600 = 300
    expect(scrollTo).toHaveBeenCalledWith({ top: 300, behavior: "smooth" });
  });

  it("点击滑块本身不触发 track 跳转（滑块阻止冒泡）", () => {
    const { scrollBar, thumb, scrollTo } = setup();
    measure(scrollBar, { top: 100, left: 0, height: 200, width: 20 });

    fireEvent.pointerDown(thumb, { clientY: 200 });

    expect(scrollTo).not.toHaveBeenCalled();
  });
});

describe("ScrollBar - 键盘滚动", () => {
  it("ArrowDown 前进 40px", () => {
    const { viewport, scrollBar } = setup();
    viewport.scrollTop = 100;

    fireEvent.keyDown(scrollBar, { key: "ArrowDown" });

    expect(viewport.scrollTop).toBe(140);
  });

  it("ArrowUp 后退 40px 且不会低于 0", () => {
    const { viewport, scrollBar } = setup();
    viewport.scrollTop = 10;

    fireEvent.keyDown(scrollBar, { key: "ArrowUp" });

    expect(viewport.scrollTop).toBe(0);
  });

  it("PageDown 使用视口高度作为步长", () => {
    const { viewport, scrollBar } = setup();
    viewport.scrollTop = 0;

    fireEvent.keyDown(scrollBar, { key: "PageDown" });

    expect(viewport.scrollTop).toBe(400);
  });

  it("Home 回到 0，End 落到内容末尾", () => {
    const { viewport, scrollBar } = setup();

    viewport.scrollTop = 300;
    fireEvent.keyDown(scrollBar, { key: "Home" });
    expect(viewport.scrollTop).toBe(0);

    fireEvent.keyDown(scrollBar, { key: "End" });
    expect(viewport.scrollTop).toBe(1000);
  });

  it("无法识别的按键不改变滚动位置", () => {
    const { viewport, scrollBar } = setup();
    viewport.scrollTop = 250;

    fireEvent.keyDown(scrollBar, { key: "Enter" });

    expect(viewport.scrollTop).toBe(250);
  });

  it("会处理的按键调用 preventDefault（阻止页面滚动）", () => {
    const { scrollBar } = setup();

    const event = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    scrollBar.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});

describe("ScrollBar - 横向交互", () => {
  it("横向拖动按 scrollLeft 换算", () => {
    const { viewport, thumb, scrollBar } = setup({
      scrollBarOrientation: "horizontal",
    });
    setMetrics(viewport, {
      clientHeight: 300,
      scrollHeight: 300,
      clientWidth: 400,
      scrollWidth: 1000,
    });
    // 横向 track 宽 202 → 内容区 200；滑块宽 100 → 比例 = 600 / 100 = 6
    setMetrics(scrollBar, { clientHeight: 20, clientWidth: 202 });
    setMetrics(thumb, { clientHeight: 20, clientWidth: 100 });

    fireEvent.pointerDown(thumb, { clientX: 0 });
    fireEvent.pointerMove(window, { clientX: 50 });

    expect(viewport.scrollLeft).toBe(300);
  });

  it("横向点击 track 用 left / width 与 scrollLeft", () => {
    const { scrollBar, scrollTo, viewport } = setup({
      scrollBarOrientation: "horizontal",
    });
    setMetrics(viewport, {
      clientHeight: 300,
      scrollHeight: 300,
      clientWidth: 400,
      scrollWidth: 1000,
    });
    measure(scrollBar, { top: 0, left: 100, height: 20, width: 200 });

    fireEvent.pointerDown(scrollBar, { clientX: 200 });

    // (200 - 100) / 200 = 0.5 → 0.5 * 600 = 300
    expect(scrollTo).toHaveBeenCalledWith({ left: 300, behavior: "smooth" });
  });

  it("横向键盘使用 clientWidth / scrollWidth 与 scrollLeft", () => {
    const { viewport, scrollBar } = setup({
      scrollBarOrientation: "horizontal",
    });
    setMetrics(viewport, {
      clientHeight: 300,
      scrollHeight: 300,
      clientWidth: 400,
      scrollWidth: 1000,
    });
    viewport.scrollLeft = 0;

    fireEvent.keyDown(scrollBar, { key: "PageDown" });
    expect(viewport.scrollLeft).toBe(400);

    fireEvent.keyDown(scrollBar, { key: "End" });
    expect(viewport.scrollLeft).toBe(1000);

    fireEvent.keyDown(scrollBar, { key: "Home" });
    expect(viewport.scrollLeft).toBe(0);
  });
});

describe("ScrollBar - 透传与样式", () => {
  it("自定义 class 与 classList 合并到 track", () => {
    const { container } = render(() => (
      <ScrollArea>
        <ScrollBar class="my-bar" classList={{ extra: true }} />
      </ScrollArea>
    ));

    const track = container.querySelector(".my-bar") as HTMLElement;
    expect(track).not.toBeNull();
    expect(track).toHaveAttribute("data-slot", "scroll-area-scrollbar");
    expect(track).toHaveClass("extra");
  });
});

describe("ScrollBar - 无可用视口时的守卫", () => {
  /** 直接构造一个 viewportRef 为空的 Context，验证交互的提前返回 */
  function renderWithoutViewport() {
    return render(() => (
      <ScrollAreaContext.Provider
        value={{
          hovering: () => false,
          viewportRef: () => undefined,
          dragging: () => null,
          setDragging: () => {},
          vertical: () => ({
            thumbRatio: 1,
            thumbOffset: 0,
            scrollable: false,
          }),
          horizontal: () => ({
            thumbRatio: 1,
            thumbOffset: 0,
            scrollable: false,
          }),
        }}
      >
        <ScrollBar />
      </ScrollAreaContext.Provider>
    ));
  }

  it("点击 track 时不抛错也不滚动", () => {
    const { container } = renderWithoutViewport();
    const scrollBar = container.querySelector(
      '[data-slot="scroll-area-scrollbar"]',
    ) as HTMLElement;

    expect(() =>
      fireEvent.pointerDown(scrollBar, { clientY: 100 }),
    ).not.toThrow();
  });

  it("按键时不抛错（无视口可滚动）", () => {
    const { container } = renderWithoutViewport();
    const scrollBar = container.querySelector(
      '[data-slot="scroll-area-scrollbar"]',
    ) as HTMLElement;

    const event = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    scrollBar.dispatchEvent(event);

    // 未走 preventDefault，说明提前返回了
    expect(event.defaultPrevented).toBe(false);
  });

  it("拖动滑块时不抛错（无视口可滚动）", () => {
    const { container } = renderWithoutViewport();
    const thumb = container.querySelector(
      '[data-slot="scroll-area-thumb"]',
    ) as HTMLElement;

    expect(() => {
      fireEvent.pointerDown(thumb, { clientY: 0 });
      fireEvent.pointerMove(window, { clientY: 40 });
    }).not.toThrow();

    // 拖动状态也不应被置位（提前 return）
    expect(thumb.className).not.toContain("bg-neutral-500");
  });
});
