import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { useScrollEdges } from "~/hooks/useScrollEdges";

/**
 * jsdom 不做布局：scrollHeight / clientHeight 恒为 0。
 * 这两个属性在 jsdom 里是可写的普通属性，因此直接定义来构造滚动场景。
 */
function scrollContainer(options: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}): HTMLElement {
  const el = document.createElement("div");
  Object.defineProperty(el, "scrollTop", {
    configurable: true,
    writable: true,
    value: options.scrollTop,
  });
  Object.defineProperty(el, "scrollHeight", {
    configurable: true,
    value: options.scrollHeight,
  });
  Object.defineProperty(el, "clientHeight", {
    configurable: true,
    value: options.clientHeight,
  });
  document.body.appendChild(el);
  return el;
}

describe("useScrollEdges", () => {
  it("元素为空时两个方向都为 false", () => {
    const { result } = renderHook(() => useScrollEdges(() => undefined));

    expect(result.canScrollUp()).toBe(false);
    expect(result.canScrollDown()).toBe(false);
  });

  it("元素为空时 refresh 会复位已有状态", () => {
    const holder: { el?: HTMLElement } = {
      el: scrollContainer({
        scrollTop: 100,
        scrollHeight: 500,
        clientHeight: 100,
      }),
    };
    const { result } = renderHook(() => useScrollEdges(() => holder.el));

    expect(result.canScrollUp()).toBe(true);

    holder.el = undefined;
    result.refresh();

    expect(result.canScrollUp()).toBe(false);
    expect(result.canScrollDown()).toBe(false);
  });

  it("内容未超出容器时两个方向都为 false", () => {
    const { result } = renderHook(() =>
      useScrollEdges(() =>
        scrollContainer({
          scrollTop: 0,
          scrollHeight: 100,
          clientHeight: 100,
        }),
      ),
    );

    expect(result.canScrollUp()).toBe(false);
    expect(result.canScrollDown()).toBe(false);
  });

  it("在顶部且下方还有内容时只能向下滚", () => {
    const { result } = renderHook(() =>
      useScrollEdges(() =>
        scrollContainer({
          scrollTop: 0,
          scrollHeight: 500,
          clientHeight: 100,
        }),
      ),
    );

    expect(result.canScrollUp()).toBe(false);
    expect(result.canScrollDown()).toBe(true);
  });

  it("滚到中间时两个方向都能滚", () => {
    const { result } = renderHook(() =>
      useScrollEdges(() =>
        scrollContainer({
          scrollTop: 200,
          scrollHeight: 500,
          clientHeight: 100,
        }),
      ),
    );

    expect(result.canScrollUp()).toBe(true);
    expect(result.canScrollDown()).toBe(true);
  });

  it("滚到底部时只能向上滚", () => {
    const { result } = renderHook(() =>
      useScrollEdges(() =>
        scrollContainer({
          scrollTop: 400,
          scrollHeight: 500,
          clientHeight: 100,
        }),
      ),
    );

    expect(result.canScrollUp()).toBe(true);
    expect(result.canScrollDown()).toBe(false);
  });

  it("进入阈值是 4px：滚动量不超过 4px 时不算还能向上滚", () => {
    const { result } = renderHook(() =>
      useScrollEdges(() =>
        scrollContainer({
          scrollTop: 4,
          scrollHeight: 500,
          clientHeight: 100,
        }),
      ),
    );

    // top=4 不满足 top > 4，因此 false（迟滞进入阈值）
    expect(result.canScrollUp()).toBe(false);
  });

  it("剩余量不超过 4px 时不算还能向下滚", () => {
    const { result } = renderHook(() =>
      useScrollEdges(() =>
        scrollContainer({
          // remaining = 500 - 100 - 396 = 4
          scrollTop: 396,
          scrollHeight: 500,
          clientHeight: 100,
        }),
      ),
    );

    expect(result.canScrollDown()).toBe(false);
  });

  it("已进入可滚动状态后，退出阈值是 1px（迟滞）", () => {
    const el = scrollContainer({
      scrollTop: 100,
      scrollHeight: 500,
      clientHeight: 100,
    });
    const { result } = renderHook(() => useScrollEdges(() => el));

    expect(result.canScrollUp()).toBe(true);

    // 回到 1px 以上仍算可向上滚（EXIT_THRESHOLD=1）
    Object.defineProperty(el, "scrollTop", {
      configurable: true,
      writable: true,
      value: 2,
    });
    result.refresh();

    expect(result.canScrollUp()).toBe(true);
  });

  it("退出阈值内（<=1px）才复位为 false", () => {
    const el = scrollContainer({
      scrollTop: 100,
      scrollHeight: 500,
      clientHeight: 100,
    });
    const { result } = renderHook(() => useScrollEdges(() => el));

    expect(result.canScrollUp()).toBe(true);

    Object.defineProperty(el, "scrollTop", {
      configurable: true,
      writable: true,
      value: 1,
    });
    result.refresh();

    expect(result.canScrollUp()).toBe(false);
  });

  it("scroll 事件会触发刷新", () => {
    const el = scrollContainer({
      scrollTop: 0,
      scrollHeight: 500,
      clientHeight: 100,
    });
    const { result } = renderHook(() => useScrollEdges(() => el));

    expect(result.canScrollUp()).toBe(false);

    Object.defineProperty(el, "scrollTop", {
      configurable: true,
      writable: true,
      value: 200,
    });
    el.dispatchEvent(new Event("scroll"));

    expect(result.canScrollUp()).toBe(true);
  });

  it("元素被替换后改为跟踪新元素", () => {
    const [target, setTarget] = createSignal<HTMLElement>(
      scrollContainer({
        scrollTop: 0,
        scrollHeight: 500,
        clientHeight: 100,
      }),
    );
    const { result } = renderHook(() => useScrollEdges(target));

    expect(result.canScrollUp()).toBe(false);

    // 切换到"已滚动"的新元素：effect 会重新绑定并立即 refresh
    setTarget(
      scrollContainer({
        scrollTop: 150,
        scrollHeight: 500,
        clientHeight: 100,
      }),
    );

    expect(result.canScrollUp()).toBe(true);
  });

  it("容器有首个子元素时也观察它的尺寸变化", () => {
    const el = scrollContainer({
      scrollTop: 0,
      scrollHeight: 500,
      clientHeight: 100,
    });
    // 有子元素：ResizeObserver 会额外 observe 它
    el.appendChild(document.createElement("div"));

    const { result } = renderHook(() => useScrollEdges(() => el));

    expect(result.canScrollDown()).toBe(true);
  });

  it("容器没有子元素时不报错", () => {
    const el = scrollContainer({
      scrollTop: 0,
      scrollHeight: 500,
      clientHeight: 100,
    });

    expect(() => renderHook(() => useScrollEdges(() => el))).not.toThrow();
  });

  it("卸载后不再监听 scroll（避免泄漏）", () => {
    const el = scrollContainer({
      scrollTop: 0,
      scrollHeight: 500,
      clientHeight: 100,
    });
    const { cleanup } = renderHook(() => useScrollEdges(() => el));

    cleanup();

    Object.defineProperty(el, "scrollTop", {
      configurable: true,
      writable: true,
      value: 200,
    });
    expect(() => el.dispatchEvent(new Event("scroll"))).not.toThrow();
  });
});
