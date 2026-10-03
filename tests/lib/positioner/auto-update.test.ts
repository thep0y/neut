import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asDOMRect, rect } from "~tests/lib/positioner/test-utils";
import { autoUpdate } from "~/lib/positioner/auto-update";

/** 记录 observe/disconnect 的 ResizeObserver 替身 */
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  observed: Element[] = [];
  disconnected = false;
  constructor(public callback: () => void) {
    FakeResizeObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve() {}
  disconnect() {
    this.disconnected = true;
  }
}

function elementWithRect(r: ReturnType<typeof rect>): HTMLElement {
  const el = document.createElement("div");
  el.getBoundingClientRect = () => asDOMRect(r);
  document.body.appendChild(el);
  return el;
}

/** 覆盖 getComputedStyle 让指定元素报告 overflow */
function withOverflow(el: Element, overflow: string) {
  const original = window.getComputedStyle;
  window.getComputedStyle = ((target: Element) =>
    target === el
      ? ({
          overflow,
          overflowX: "",
          overflowY: "",
        } as CSSStyleDeclaration)
      : original(target)) as typeof window.getComputedStyle;
  return () => {
    window.getComputedStyle = original;
  };
}

describe("autoUpdate", () => {
  const originalResizeObserver = globalThis.ResizeObserver;

  beforeEach(() => {
    FakeResizeObserver.instances = [];
    globalThis.ResizeObserver =
      FakeResizeObserver as unknown as typeof ResizeObserver;
  });

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("window resize 会触发 update", () => {
    const update = vi.fn();
    const reference = elementWithRect(rect(0, 0, 10, 10));
    const floating = elementWithRect(rect(0, 0, 10, 10));

    const cleanup = autoUpdate(reference, floating, update);
    window.dispatchEvent(new Event("resize"));

    expect(update).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it("清理函数移除 window resize 监听", () => {
    const update = vi.fn();
    const reference = elementWithRect(rect(0, 0, 10, 10));
    const floating = elementWithRect(rect(0, 0, 10, 10));

    const cleanup = autoUpdate(reference, floating, update);
    cleanup();
    window.dispatchEvent(new Event("resize"));

    expect(update).not.toHaveBeenCalled();
  });

  it("监听可滚动祖先的 scroll 事件", () => {
    const update = vi.fn();
    const scroller = elementWithRect(rect(0, 0, 100, 100));
    const restore = withOverflow(scroller, "auto");

    const reference = document.createElement("div");
    scroller.appendChild(reference);
    const floating = elementWithRect(rect(0, 0, 10, 10));

    try {
      const cleanup = autoUpdate(reference, floating, update);
      scroller.dispatchEvent(new Event("scroll"));

      expect(update).toHaveBeenCalledTimes(1);

      cleanup();
    } finally {
      restore();
    }
  });

  it("ancestorScroll=false 时不监听滚动", () => {
    const update = vi.fn();
    const scroller = elementWithRect(rect(0, 0, 100, 100));
    const restore = withOverflow(scroller, "auto");

    const reference = document.createElement("div");
    scroller.appendChild(reference);
    const floating = elementWithRect(rect(0, 0, 10, 10));

    try {
      const cleanup = autoUpdate(reference, floating, update, {
        ancestorScroll: false,
      });
      scroller.dispatchEvent(new Event("scroll"));

      expect(update).not.toHaveBeenCalled();

      cleanup();
    } finally {
      restore();
    }
  });

  it("elementResize 时观察 reference 与 floating", () => {
    const update = vi.fn();
    const reference = elementWithRect(rect(0, 0, 10, 10));
    const floating = elementWithRect(rect(0, 0, 10, 10));

    const cleanup = autoUpdate(reference, floating, update);
    const observer = FakeResizeObserver.instances[0];

    expect(observer.observed).toContain(reference);
    expect(observer.observed).toContain(floating);

    cleanup();
  });

  it("ResizeObserver 回调触发 update", () => {
    const update = vi.fn();
    const reference = elementWithRect(rect(0, 0, 10, 10));
    const floating = elementWithRect(rect(0, 0, 10, 10));

    const cleanup = autoUpdate(reference, floating, update);
    FakeResizeObserver.instances[0].callback();

    expect(update).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it("清理函数断开 ResizeObserver", () => {
    const update = vi.fn();
    const reference = elementWithRect(rect(0, 0, 10, 10));
    const floating = elementWithRect(rect(0, 0, 10, 10));

    const cleanup = autoUpdate(reference, floating, update);
    const observer = FakeResizeObserver.instances[0];
    cleanup();

    expect(observer.disconnected).toBe(true);
  });

  it("elementResize=false 且 ancestorResize=false 时不创建 ResizeObserver", () => {
    const update = vi.fn();
    const reference = elementWithRect(rect(0, 0, 10, 10));
    const floating = elementWithRect(rect(0, 0, 10, 10));

    const cleanup = autoUpdate(reference, floating, update, {
      elementResize: false,
      ancestorResize: false,
    });

    expect(FakeResizeObserver.instances).toHaveLength(0);

    cleanup();
  });

  it("虚拟参照元素（无 contextElement）只监听 window resize", () => {
    const update = vi.fn();
    const virtual = {
      getBoundingClientRect: () => asDOMRect(rect(0, 0, 0, 0)),
    };
    const floating = elementWithRect(rect(0, 0, 10, 10));

    const cleanup = autoUpdate(virtual, floating, update);

    window.dispatchEvent(new Event("resize"));
    expect(update).toHaveBeenCalledTimes(1);

    // 只观察 floating，不观察虚拟元素
    expect(FakeResizeObserver.instances[0].observed).toEqual([floating]);

    cleanup();
  });

  it("虚拟参照元素带 contextElement 时用它查找滚动祖先", () => {
    const update = vi.fn();
    const scroller = elementWithRect(rect(0, 0, 100, 100));
    const restore = withOverflow(scroller, "auto");

    const anchor = document.createElement("div");
    scroller.appendChild(anchor);

    const virtual = {
      getBoundingClientRect: () => asDOMRect(rect(0, 0, 0, 0)),
      contextElement: anchor,
    };
    const floating = elementWithRect(rect(0, 0, 10, 10));

    try {
      const cleanup = autoUpdate(virtual, floating, update);
      scroller.dispatchEvent(new Event("scroll"));

      expect(update).toHaveBeenCalledTimes(1);

      cleanup();
    } finally {
      restore();
    }
  });

  it("ResizeObserver 不存在时不报错", () => {
    const update = vi.fn();
    // @ts-expect-error 故意移除，模拟不支持的老环境
    globalThis.ResizeObserver = undefined;
    const reference = elementWithRect(rect(0, 0, 10, 10));
    const floating = elementWithRect(rect(0, 0, 10, 10));

    expect(() => {
      const cleanup = autoUpdate(reference, floating, update);
      window.dispatchEvent(new Event("resize"));
      expect(update).toHaveBeenCalledTimes(1);
      cleanup();
    }).not.toThrow();
  });

  it("ancestorResize 时跳过非 Element 祖先（window）", () => {
    const update = vi.fn();
    const reference = elementWithRect(rect(0, 0, 10, 10));
    const floating = elementWithRect(rect(0, 0, 10, 10));

    // 每个节点都会得到 window 作为最后一个"祖先"，
    // 它不是 Element，必须被 `instanceof Element` 判断跳过，
    // 否则 ResizeObserver.observe(window) 会抛错。
    const cleanup = autoUpdate(reference, floating, update, {
      elementResize: false,
    });

    const observer = FakeResizeObserver.instances[0];
    expect(observer.observed).not.toContain(window);

    cleanup();
  });

  it("ancestorResize 时观察可滚动祖先元素（跳过 window）", () => {
    const update = vi.fn();
    // 用独立容器隔离，避免上一个用例留下的可滚动节点混进 ancestors
    const host = document.createElement("div");
    document.body.appendChild(host);
    const scroller = document.createElement("div");
    scroller.getBoundingClientRect = () => asDOMRect(rect(0, 0, 100, 100));
    host.appendChild(scroller);

    const restore = withOverflow(scroller, "scroll");

    const reference = document.createElement("div");
    scroller.appendChild(reference);
    const floating = elementWithRect(rect(0, 0, 10, 10));

    try {
      const cleanup = autoUpdate(reference, floating, update, {
        elementResize: false,
        ancestorScroll: false,
      });
      const observer = FakeResizeObserver.instances[0];

      // elementResize=false 时只应由 ancestorResize 分支 observe(scroller)；
      // window 不是 Element，必须被跳过（否则 observe(window) 会抛错）。
      expect(observer.observed).toEqual([scroller]);

      cleanup();
    } finally {
      restore();
      host.remove();
    }
  });
});
