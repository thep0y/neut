import { render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useScrollAreaMetrics } from "~/components/scroll-area/ScrollArea/useScrollAreaMetrics";

/**
 * `useScrollAreaMetrics` 的单元测试：直接驱动 hook 的观察/测量逻辑，
 * 不经过 ScrollArea 的样式与 DOM 结构。
 *
 * jsdom 无布局，因此显式 stub 尺寸并捕获 ResizeObserver 回调。
 */

/** 记录 ResizeObserver 的 observe/unobserve/disconnect 调用 */
function installResizeObserver() {
  const observed: Element[] = [];
  const unobserved: Element[] = [];
  const callbacks: Array<() => void> = [];
  const disconnect = vi.fn();
  class TestResizeObserver {
    constructor(cb: () => void) {
      callbacks.push(cb);
    }
    observe(target: Element) {
      observed.push(target);
    }
    unobserve(target: Element) {
      unobserved.push(target);
    }
    disconnect = disconnect;
  }
  vi.stubGlobal("ResizeObserver", TestResizeObserver);
  return { observed, unobserved, callbacks, disconnect };
}

/** 让元素报告指定尺寸（jsdom 属性只有 getter） */
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

afterEach(() => {
  document.body.innerHTML = "";
});

/** 渲染一个由 hook 直接驱动的视口 */
function renderHookHost() {
  let api: ReturnType<typeof useScrollAreaMetrics> | undefined;
  const [child, setChild] = createSignal<"a" | "b" | "none">("a");

  render(() => {
    api = useScrollAreaMetrics();
    return (
      <div ref={api.setup} data-testid="viewport">
        {child() === "a" ? <div data-testid="content-a" /> : null}
        {child() === "b" ? <div data-testid="content-b" /> : null}
      </div>
    );
  });

  const viewport = document.querySelector(
    '[data-testid="viewport"]',
  ) as HTMLElement;
  return {
    api: api as ReturnType<typeof useScrollAreaMetrics>,
    viewport,
    setChild,
  };
}

describe("useScrollAreaMetrics - 初始状态", () => {
  it("初始指标为不可滚动的单位值", () => {
    const { api } = renderHookHost();

    expect(api.vertical()).toEqual({
      thumbRatio: 1,
      thumbOffset: 0,
      scrollable: false,
    });
    expect(api.horizontal()).toEqual({
      thumbRatio: 1,
      thumbOffset: 0,
      scrollable: false,
    });
  });

  it("viewportRef 在 setup 后指向视口元素", () => {
    const { api, viewport } = renderHookHost();

    expect(api.viewportRef()).toBe(viewport);
  });
});

describe("useScrollAreaMetrics - 观察器绑定", () => {
  it("观察视口本身", () => {
    const { observed } = installResizeObserver();
    const { viewport } = renderHookHost();

    expect(observed).toContain(viewport);
  });

  it("挂载后观察真实的内容元素（而不是 ref 阶段的占位节点）", () => {
    const { observed } = installResizeObserver();
    const { api } = renderHookHost();

    const contentA = document.querySelector('[data-testid="content-a"]');
    expect(observed).toContain(contentA);
    // 占位节点被替换后，内容元素就是当前第一个子元素
    expect(api.viewportRef()?.firstElementChild).toBe(contentA);
  });

  it("内容元素变化时先 unobserve 旧的再 observe 新的", async () => {
    const { observed, unobserved } = installResizeObserver();
    const { setChild, viewport } = renderHookHost();
    const contentA = document.querySelector('[data-testid="content-a"]');

    setChild("b");
    // MutationObserver 回调是微任务，需要让出一轮
    await Promise.resolve();
    await Promise.resolve();

    const contentB = document.querySelector('[data-testid="content-b"]');
    expect(observed).toContain(contentB);
    expect(unobserved).toContain(contentA);
    expect(viewport.firstElementChild).toBe(contentB);
  });

  it("内容替换后按新内容尺寸刷新指标", async () => {
    installResizeObserver();
    const { api, viewport, setChild } = renderHookHost();
    setMetrics(viewport, {
      clientHeight: 100,
      scrollHeight: 400,
      clientWidth: 100,
      scrollWidth: 100,
    });

    setChild("b");
    viewport.scrollTop = 300;
    await Promise.resolve();
    await Promise.resolve();

    expect(api.vertical()).toEqual({
      thumbRatio: 0.25,
      thumbOffset: 1,
      scrollable: true,
    });
  });

  it("内容被移除时不 observe 空节点", () => {
    const { observed } = installResizeObserver();
    const { setChild, viewport } = renderHookHost();

    setChild("none");

    expect(viewport.firstElementChild).toBeNull();
    expect(observed).not.toContain(null);
    // 只 observe 过视口与最初的内容元素
    expect(observed).toHaveLength(2);
  });

  it("卸载时 disconnect 观察器并解绑 scroll 监听", () => {
    const { disconnect } = installResizeObserver();
    let api: ReturnType<typeof useScrollAreaMetrics> | undefined;

    const { unmount } = render(() => {
      api = useScrollAreaMetrics();
      return (
        <div ref={api.setup} data-testid="viewport">
          <div data-testid="content" />
        </div>
      );
    });
    const viewport = document.querySelector(
      '[data-testid="viewport"]',
    ) as HTMLElement;
    setMetrics(viewport, {
      clientHeight: 100,
      scrollHeight: 400,
      clientWidth: 100,
      scrollWidth: 100,
    });
    viewport.scrollTop = 300;
    viewport.dispatchEvent(new Event("scroll"));
    const afterScroll = api?.vertical();

    unmount();

    expect(disconnect).toHaveBeenCalled();
    expect(api?.viewportRef()).toBeUndefined();
    // 监听已解绑：继续滚动不会改写指标
    viewport.scrollTop = 0;
    viewport.dispatchEvent(new Event("scroll"));
    expect(api?.vertical()).toEqual(afterScroll);
  });
});

describe("useScrollAreaMetrics - 测量", () => {
  it("scroll 事件按视口尺寸刷新指标", () => {
    installResizeObserver();
    const { api, viewport } = renderHookHost();
    setMetrics(viewport, {
      clientHeight: 300,
      scrollHeight: 900,
      clientWidth: 200,
      scrollWidth: 200,
    });

    viewport.scrollTop = 300;
    viewport.dispatchEvent(new Event("scroll"));

    expect(api.vertical()).toEqual({
      thumbRatio: 300 / 900,
      thumbOffset: 0.5,
      scrollable: true,
    });
    // 横向无溢出 → 不可滚动
    expect(api.horizontal()).toEqual({
      thumbRatio: 1,
      thumbOffset: 0,
      scrollable: false,
    });
  });

  it("ResizeObserver 回调刷新指标", () => {
    const { callbacks } = installResizeObserver();
    const { api, viewport } = renderHookHost();
    setMetrics(viewport, {
      clientHeight: 100,
      scrollHeight: 400,
      clientWidth: 100,
      scrollWidth: 400,
    });

    viewport.scrollLeft = 150;
    for (const cb of callbacks) cb();

    expect(api.horizontal()).toEqual({
      thumbRatio: 0.25,
      thumbOffset: 0.5,
      scrollable: true,
    });
  });

  it("环境没有 MutationObserver 时仍能测量（退化为仅 observe 视口与首个内容元素）", () => {
    const { observed } = installResizeObserver();
    vi.stubGlobal("MutationObserver", undefined);
    const { api, viewport } = renderHookHost();
    setMetrics(viewport, {
      clientHeight: 100,
      scrollHeight: 400,
      clientWidth: 100,
      scrollWidth: 100,
    });

    viewport.scrollTop = 200;
    viewport.dispatchEvent(new Event("scroll"));

    expect(observed).toHaveLength(2);
    expect(api.vertical()).toEqual({
      thumbRatio: 0.25,
      thumbOffset: 2 / 3,
      scrollable: true,
    });
  });

  it("没有挂载视口时观察器回调与测量都不会抛错", () => {
    const { callbacks, observed } = installResizeObserver();
    let api: ReturnType<typeof useScrollAreaMetrics> | undefined;
    // 只渲染 hook，不渲染任何绑定 ref 的视口
    render(() => {
      api = useScrollAreaMetrics();
      return <div />;
    });

    for (const cb of callbacks) cb();

    expect(observed).toHaveLength(0);
    expect(api?.viewportRef()).toBeUndefined();
    expect(api?.vertical()).toEqual({
      thumbRatio: 1,
      thumbOffset: 0,
      scrollable: false,
    });
  });
});
