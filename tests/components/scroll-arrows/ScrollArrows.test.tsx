import { render } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollArrows } from "~/components/scroll-arrows/ScrollArrows";
import { stubRect } from "~tests/components/message-scroller/test-utils";

/**
 * `ScrollArrows` 的接线：用 `useScrollEdges` 决定两个箭头的显隐，
 * 并按 `hoverScroll`（默认 true）把悬停滚动挂到容器上。
 *
 * 显隐依赖真实测量（jsdom 恒为 0），因此这里 stub 容器的滚动尺寸与矩形；
 * 悬停滚动的细节由 `useHoverScroll.test.ts` 覆盖，这里只验证"确实挂上了/确实关掉了"。
 */

/** 可滚容器：400 高、内容 1000，滚动条语义夹取 */
function viewport() {
  const element = document.createElement("div");
  Object.defineProperty(element, "clientHeight", {
    configurable: true,
    value: 400,
  });
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    value: 1000,
  });
  let scrollTop = 0;
  Object.defineProperty(element, "scrollTop", {
    configurable: true,
    get: () => scrollTop,
    set: (value: number) => {
      scrollTop = Math.max(0, Math.min(value, 600));
    },
  });
  stubRect(element, { top: 0, bottom: 400, height: 400 });
  document.body.appendChild(element);
  return element;
}

function renderArrows(element: HTMLElement, hoverScroll?: boolean) {
  return render(() => (
    <div>
      <ScrollArrows
        target={() => element}
        hoverScroll={hoverScroll}
        upClass="rounded-t-lg"
        downClass="rounded-b-lg"
      />
    </div>
  ));
}

function arrowsOf(container: HTMLElement) {
  return {
    up: container.querySelector("[data-direction='up']"),
    down: container.querySelector("[data-direction='down']"),
  };
}

/** 把指针移到容器某个 clientY 处 */
function hover(element: HTMLElement, clientY: number) {
  element.dispatchEvent(
    new PointerEvent("pointermove", { clientY, bubbles: true }),
  );
}

async function flushFrames(times = 1) {
  for (let index = 0; index < times; index += 1) {
    await vi.advanceTimersByTimeAsync(16);
  }
}

beforeEach(() => {
  document.body.innerHTML = "";
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("ScrollArrows - 箭头显隐", () => {
  it("顶部、底部都有内容时两个箭头都渲染", () => {
    const element = viewport();
    element.scrollTop = 200;
    const { container } = renderArrows(element);

    expect(arrowsOf(container).up).not.toBeNull();
    expect(arrowsOf(container).down).not.toBeNull();
  });

  it("在顶部时只显示向下的箭头", () => {
    const element = viewport();
    const { container } = renderArrows(element);

    expect(arrowsOf(container).up).toBeNull();
    expect(arrowsOf(container).down).not.toBeNull();
  });

  it("在底部时只显示向上的箭头", () => {
    const element = viewport();
    element.scrollTop = 600;
    const { container } = renderArrows(element);

    expect(arrowsOf(container).up).not.toBeNull();
    expect(arrowsOf(container).down).toBeNull();
  });

  it("内容放得下时两个箭头都不渲染", () => {
    const element = viewport();
    Object.defineProperty(element, "scrollHeight", {
      configurable: true,
      value: 300,
    });
    const { container } = renderArrows(element);

    expect(arrowsOf(container).up).toBeNull();
    expect(arrowsOf(container).down).toBeNull();
  });

  it("滚动后显隐跟着更新（scroll 事件驱动）", () => {
    const element = viewport();
    const { container } = renderArrows(element);
    expect(arrowsOf(container).down).not.toBeNull();
    expect(arrowsOf(container).up).toBeNull();

    element.scrollTop = 100;
    element.dispatchEvent(new Event("scroll"));

    expect(arrowsOf(container).up).not.toBeNull();
  });
});

describe("ScrollArrows - 装饰性", () => {
  it("两个箭头都不参与指针命中", () => {
    const element = viewport();
    element.scrollTop = 200;
    const { container } = renderArrows(element);
    const { up, down } = arrowsOf(container);

    expect(up?.className).toContain("pointer-events-none");
    expect(down?.className).toContain("pointer-events-none");
  });

  it("upClass / downClass 分别应用到两个箭头", () => {
    const element = viewport();
    element.scrollTop = 200;
    const { container } = renderArrows(element);
    const { up, down } = arrowsOf(container);

    expect(up?.className).toContain("rounded-t-lg");
    expect(down?.className).toContain("rounded-b-lg");
  });
});

describe("ScrollArrows - 悬停滚动开关", () => {
  it("默认开启：指针停在底部带内会向下滚", async () => {
    const element = viewport();
    const { unmount } = renderArrows(element);

    hover(element, 390);
    await vi.advanceTimersByTimeAsync(150);
    await flushFrames(1);

    expect(element.scrollTop).toBeGreaterThan(0);
    unmount();
  });

  it("hoverScroll={false} 时完全不动", async () => {
    const element = viewport();
    const { unmount } = renderArrows(element, false);

    hover(element, 390);
    await vi.advanceTimersByTimeAsync(150);
    await flushFrames(2);

    expect(element.scrollTop).toBe(0);
    unmount();
  });

  it("卸载后不再响应指针", async () => {
    const element = viewport();
    const { unmount } = renderArrows(element);
    unmount();

    hover(element, 390);
    await vi.advanceTimersByTimeAsync(150);
    await flushFrames(2);

    expect(element.scrollTop).toBe(0);
  });
});
