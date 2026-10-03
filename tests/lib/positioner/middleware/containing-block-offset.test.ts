import { describe, expect, it } from "vitest";
import {
  asDOMRect,
  middlewareState,
  rect,
} from "~tests/lib/positioner/test-utils";
import { containingBlockOffset } from "~/lib/positioner/middleware/containing-block-offset";

/**
 * `containingBlockOffset` 会沿 floating 的父链查找"意外包含块"。
 * jsdom 里 `getComputedStyle` 返回的是元素自己的内联样式，
 * 因此可以通过给祖先设置 transform / will-change / contain 来构造场景。
 */
function buildTree(options: {
  ancestorStyle?: string;
  ancestorRect?: ReturnType<typeof rect>;
}) {
  const root = document.createElement("div");
  const ancestor = document.createElement("div");
  const parent = document.createElement("div");
  const floating = document.createElement("div");

  if (options.ancestorStyle) {
    ancestor.setAttribute("style", options.ancestorStyle);
  }
  ancestor.appendChild(parent);
  parent.appendChild(floating);
  root.appendChild(ancestor);
  document.body.appendChild(root);

  if (options.ancestorRect) {
    ancestor.getBoundingClientRect = () => asDOMRect(options.ancestorRect!);
  }

  return { root, ancestor, parent, floating };
}

describe("containingBlockOffset", () => {
  it("middleware 名为 containingBlockOffset", () => {
    expect(containingBlockOffset().name).toBe("containingBlockOffset");
  });

  it("没有会重新定义包含块的祖先时坐标不变", () => {
    const { root, floating } = buildTree({});
    const state = middlewareState({ x: 100, y: 100, placement: "bottom" });
    state.elements.floating = floating;

    const result = containingBlockOffset().fn(state);

    expect(result.x).toBeUndefined();
    expect(result.y).toBeUndefined();
    expect(result.data).toEqual({ ancestor: null });

    document.body.removeChild(root);
  });

  it("祖先有 transform 时按该祖先的偏移量修正坐标", () => {
    // translateZ(0) 是 GPU 加速里最常见的"意外包含块"来源
    const { root, ancestor, floating } = buildTree({
      ancestorStyle: "transform: translateZ(0)",
      ancestorRect: rect(30, 40, 500, 400),
    });
    const state = middlewareState({ x: 100, y: 100, placement: "bottom" });
    state.elements.floating = floating;

    const result = containingBlockOffset().fn(state);

    expect(result.x).toBe(70); // 100 - 30
    expect(result.y).toBe(60); // 100 - 40
    expect(result.data).toEqual({
      ancestor,
      offsetX: 30,
      offsetY: 40,
    });

    document.body.removeChild(root);
  });

  it("祖先有 will-change: transform 时同样修正", () => {
    const { root, floating } = buildTree({
      ancestorStyle: "will-change: transform",
      ancestorRect: rect(10, 10, 500, 400),
    });
    const state = middlewareState({ x: 100, y: 100, placement: "bottom" });
    state.elements.floating = floating;

    const result = containingBlockOffset().fn(state);

    expect(result.x).toBe(90);
    expect(result.y).toBe(90);

    document.body.removeChild(root);
  });

  it("祖先有 contain: paint 时同样修正", () => {
    const { root, floating } = buildTree({
      ancestorStyle: "contain: paint",
      ancestorRect: rect(5, 5, 500, 400),
    });
    const state = middlewareState({ x: 100, y: 100, placement: "bottom" });
    state.elements.floating = floating;

    const result = containingBlockOffset().fn(state);

    expect(result.x).toBe(95);
    expect(result.y).toBe(95);

    document.body.removeChild(root);
  });

  it("祖先有 filter 时同样修正", () => {
    const { root, floating } = buildTree({
      ancestorStyle: "filter: blur(2px)",
      ancestorRect: rect(7, 9, 500, 400),
    });
    const state = middlewareState({ x: 100, y: 100, placement: "bottom" });
    state.elements.floating = floating;

    const result = containingBlockOffset().fn(state);

    expect(result.x).toBe(93);
    expect(result.y).toBe(91);

    document.body.removeChild(root);
  });

  it("包含块偏移为 0 时视为没有偏移，坐标不变", () => {
    const { root, floating } = buildTree({
      ancestorStyle: "transform: translateZ(0)",
      ancestorRect: rect(0, 0, 500, 400),
    });
    const state = middlewareState({ x: 100, y: 100, placement: "bottom" });
    state.elements.floating = floating;

    const result = containingBlockOffset().fn(state);

    expect(result.x).toBeUndefined();
    expect(result.y).toBeUndefined();
    expect(result.data).toEqual({ ancestor: null });

    document.body.removeChild(root);
  });

  it("transform: none 不算建立包含块", () => {
    const { root, floating } = buildTree({
      ancestorStyle: "transform: none",
      ancestorRect: rect(50, 50, 500, 400),
    });
    const state = middlewareState({ x: 100, y: 100, placement: "bottom" });
    state.elements.floating = floating;

    const result = containingBlockOffset().fn(state);

    expect(result.data).toEqual({ ancestor: null });

    document.body.removeChild(root);
  });

  it("will-change 不含相关关键字时不建立包含块", () => {
    const { root, floating } = buildTree({
      ancestorStyle: "will-change: opacity",
      ancestorRect: rect(50, 50, 500, 400),
    });
    const state = middlewareState({ x: 100, y: 100, placement: "bottom" });
    state.elements.floating = floating;

    const result = containingBlockOffset().fn(state);

    expect(result.data).toEqual({ ancestor: null });

    document.body.removeChild(root);
  });

  it("contain 不含相关关键字时不建立包含块", () => {
    const { root, floating } = buildTree({
      ancestorStyle: "contain: size",
      ancestorRect: rect(50, 50, 500, 400),
    });
    const state = middlewareState({ x: 100, y: 100, placement: "bottom" });
    state.elements.floating = floating;

    const result = containingBlockOffset().fn(state);

    expect(result.data).toEqual({ ancestor: null });

    document.body.removeChild(root);
  });

  it("contain: strict 建立包含块", () => {
    const { root, floating } = buildTree({
      ancestorStyle: "contain: strict",
      ancestorRect: rect(8, 8, 500, 400),
    });
    const state = middlewareState({ x: 100, y: 100, placement: "bottom" });
    state.elements.floating = floating;

    const result = containingBlockOffset().fn(state);

    expect(result.x).toBe(92);
    expect(result.y).toBe(92);

    document.body.removeChild(root);
  });

  it("will-change: perspective 建立包含块", () => {
    const { root, floating } = buildTree({
      ancestorStyle: "will-change: perspective",
      ancestorRect: rect(6, 6, 500, 400),
    });
    const state = middlewareState({ x: 100, y: 100, placement: "bottom" });
    state.elements.floating = floating;

    const result = containingBlockOffset().fn(state);

    expect(result.x).toBe(94);
    expect(result.y).toBe(94);

    document.body.removeChild(root);
  });

  it("perspective 属性建立包含块", () => {
    const { root, floating } = buildTree({
      ancestorStyle: "perspective: 500px",
      ancestorRect: rect(2, 3, 500, 400),
    });
    const state = middlewareState({ x: 100, y: 100, placement: "bottom" });
    state.elements.floating = floating;

    const result = containingBlockOffset().fn(state);

    expect(result.x).toBe(98);
    expect(result.y).toBe(97);

    document.body.removeChild(root);
  });

  it("backdropFilter 建立包含块", () => {
    const { root, floating } = buildTree({
      ancestorStyle: "backdrop-filter: blur(4px)",
      ancestorRect: rect(11, 12, 500, 400),
    });
    const state = middlewareState({ x: 100, y: 100, placement: "bottom" });
    state.elements.floating = floating;

    const result = containingBlockOffset().fn(state);

    expect(result.x).toBe(89);
    expect(result.y).toBe(88);

    document.body.removeChild(root);
  });

  it("computedStyle 未提供 willChange / contain 时不报错（undefined 兜底）", () => {
    // jsdom 总会为这两个属性返回字符串（内联值或 auto/none），
    // 因此 `style.willChange || ""` 的右侧分支在 jsdom 里不可达；
    // 但真实浏览器/老引擎存在返回 undefined 的情况，用 stub 覆盖这个兜底。
    const root = document.createElement("div");
    const floating = document.createElement("div");
    root.appendChild(floating);
    document.body.appendChild(root);

    const original = window.getComputedStyle;
    window.getComputedStyle = (() => ({
      transform: "",
      perspective: "",
      filter: "",
      backdropFilter: "",
      willChange: undefined,
      contain: undefined,
    })) as unknown as typeof window.getComputedStyle;

    try {
      const state = middlewareState({ x: 100, y: 100, placement: "bottom" });
      state.elements.floating = floating;

      expect(() => containingBlockOffset().fn(state)).not.toThrow();
      expect(containingBlockOffset().fn(state).data).toEqual({
        ancestor: null,
      });
    } finally {
      window.getComputedStyle = original;
      document.body.removeChild(root);
    }
  });

  it("只取最靠近 floating 的那个包含块祖先", () => {
    const { root, ancestor, parent, floating } = buildTree({
      ancestorStyle: "transform: translateZ(0)",
      ancestorRect: rect(30, 40, 500, 400),
    });
    // 更近的父级也建立包含块：应优先用它
    parent.setAttribute("style", "will-change: transform");
    parent.getBoundingClientRect = () => asDOMRect(rect(3, 4, 100, 100));

    const state = middlewareState({ x: 100, y: 100, placement: "bottom" });
    state.elements.floating = floating;

    const result = containingBlockOffset().fn(state);

    expect(result.x).toBe(97);
    expect(result.y).toBe(96);
    expect(result.data).toEqual({
      ancestor: parent,
      offsetX: 3,
      offsetY: 4,
    });
    expect(result.data).not.toEqual(expect.objectContaining({ ancestor }));

    document.body.removeChild(root);
  });

  it("不产出坐标以外的副作用", () => {
    const { root, floating } = buildTree({});
    const state = middlewareState({ x: 42, y: 7, placement: "bottom" });
    state.elements.floating = floating;

    const result = containingBlockOffset().fn(state);

    expect(Object.keys(result).sort()).toEqual(["data"]);

    document.body.removeChild(root);
  });
});
