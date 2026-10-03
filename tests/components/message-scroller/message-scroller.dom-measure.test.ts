import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDomMeasure } from "~/components/message-scroller/message-scroller.dom-measure";
import {
  measured,
  setScrollMetrics,
  stubRect,
} from "~tests/components/message-scroller/test-utils";

/**
 * DOM 几何测量的单测。
 *
 * jsdom 不做布局，因此这里显式 stub 矩形与滚动尺寸，用可控坐标系驱动
 * （TESTING.md §4.5：只 mock 系统边界）。
 */

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function setup(
  initial: {
    viewport?: HTMLElement;
    content?: HTMLElement;
    spacer?: HTMLElement;
  } = {},
) {
  const [viewport, setViewport] = createSignal<HTMLElement | undefined>(
    initial.viewport,
  );
  const [content, setContent] = createSignal<HTMLElement | undefined>(
    initial.content,
  );
  const [spacer, setSpacer] = createSignal<HTMLElement | undefined>(
    initial.spacer,
  );

  const hook = renderHook(() =>
    createDomMeasure({ viewport, content, spacer }),
  );

  return { ...hook, setViewport, setContent, setSpacer };
}

describe("createDomMeasure items", () => {
  it("没有 content 时为空", () => {
    const { result } = setup();

    expect(result.items()).toEqual([]);
  });

  it("排除 spacer、过滤非 HTMLElement 子节点", () => {
    const content = document.createElement("div");
    const row = document.createElement("div");
    const spacer = document.createElement("div");
    content.append(row, spacer, document.createTextNode("orphan"));
    const { result } = setup({ content, spacer });

    expect(result.items()).toEqual([row]);
  });

  it("spacer 尚未设置时全部子元素都算行", () => {
    const content = document.createElement("div");
    const row = document.createElement("div");
    content.append(row);
    const { result } = setup({ content });

    expect(result.items()).toEqual([row]);
  });
});

describe("createDomMeasure itemOffsetTop / itemTopInViewport", () => {
  it("没有 viewport 时都返回 0", () => {
    const row = document.createElement("div");
    stubRect(row, { top: 120, bottom: 220 });
    const { result } = setup();

    expect(result.itemOffsetTop(row)).toBe(0);
    expect(result.itemTopInViewport(row)).toBe(0);
  });

  it("itemOffsetTop 把视口滚动量加回内容坐标", () => {
    const viewport = document.createElement("div");
    measured(viewport, { top: 0, bottom: 400 });
    Object.defineProperty(viewport, "scrollTop", {
      configurable: true,
      writable: true,
      value: 300,
    });
    const row = document.createElement("div");
    stubRect(row, { top: -100, bottom: 200 });
    const { result } = setup({ viewport });

    // -100 - 0 + 300 = 200
    expect(result.itemOffsetTop(row)).toBe(200);
    expect(result.itemTopInViewport(row)).toBe(-100);
  });

  it("视口不在页面顶部时按相对偏移计算", () => {
    const viewport = document.createElement("div");
    measured(viewport, { top: 50, bottom: 450 });
    Object.defineProperty(viewport, "scrollTop", {
      configurable: true,
      writable: true,
      value: 0,
    });
    const row = document.createElement("div");
    stubRect(row, { top: 150, bottom: 250 });
    const { result } = setup({ viewport });

    expect(result.itemOffsetTop(row)).toBe(100);
    expect(result.itemTopInViewport(row)).toBe(100);
  });
});

describe("createDomMeasure contentBottom", () => {
  it("没有 viewport 或 content 时返回 0", () => {
    const content = document.createElement("div");
    const { result } = setup({ content });
    expect(result.contentBottom()).toBe(0);

    const viewport = document.createElement("div");
    const other = setup({ viewport });
    expect(other.result.contentBottom()).toBe(0);
  });

  it("没有行时只算上下内边距", () => {
    const viewport = document.createElement("div");
    measured(viewport, { top: 0, bottom: 400 });
    Object.defineProperty(viewport, "scrollTop", {
      configurable: true,
      writable: true,
      value: 0,
    });
    const content = document.createElement("div");
    const original = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      (element: Element) =>
        ({
          ...original(element),
          paddingBlockStart: "12px",
          paddingBlockEnd: "8px",
        }) as unknown as CSSStyleDeclaration,
    );
    const { result } = setup({ viewport, content });

    expect(result.contentBottom()).toBe(20);
  });

  it("多行时取最大的底边（并加回滚动量）", () => {
    const viewport = document.createElement("div");
    measured(viewport, { top: 0, bottom: 400 });
    Object.defineProperty(viewport, "scrollTop", {
      configurable: true,
      writable: true,
      value: 200,
    });
    const content = document.createElement("div");
    const a = document.createElement("div");
    stubRect(a, { top: 0, bottom: 300 });
    const b = document.createElement("div");
    stubRect(b, { top: 300, bottom: 800 });
    content.append(a, b);
    const { result } = setup({ viewport, content });

    // 800 - 0 + 200 = 1000
    expect(result.contentBottom()).toBe(1000);
  });

  it("排除 spacer 的高度", () => {
    const viewport = document.createElement("div");
    measured(viewport, { top: 0, bottom: 400 });
    Object.defineProperty(viewport, "scrollTop", {
      configurable: true,
      writable: true,
      value: 0,
    });
    const content = document.createElement("div");
    const row = document.createElement("div");
    stubRect(row, { top: 0, bottom: 300 });
    const spacer = document.createElement("div");
    stubRect(spacer, { top: 300, bottom: 3000 });
    content.append(row, spacer);
    const { result } = setup({ viewport, content, spacer });

    expect(result.contentBottom()).toBe(300);
  });
});

describe("createDomMeasure maxScrollTop", () => {
  it("没有 viewport 时返回 0", () => {
    const { result } = setup();

    expect(result.maxScrollTop()).toBe(0);
  });

  it("等于滚动高度减去可视高度", () => {
    const viewport = document.createElement("div");
    setScrollMetrics(viewport, { scrollHeight: 1000, clientHeight: 400 });
    const { result } = setup({ viewport });

    expect(result.maxScrollTop()).toBe(600);
  });

  it("内容比视口矮时归零（不返回负数）", () => {
    const viewport = document.createElement("div");
    setScrollMetrics(viewport, { scrollHeight: 200, clientHeight: 400 });
    const { result } = setup({ viewport });

    expect(result.maxScrollTop()).toBe(0);
  });
});
