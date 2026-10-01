import { describe, expect, it } from "vitest";
import type { ToastT } from "./Toast.types";
import {
  getAnimationClasses,
  getCollapsedTransform,
  getToastStyle,
  getVerticalAxis,
  isFrontToast,
  resolveToastContent,
} from "./Toast.utils";

describe("resolveToastContent", () => {
  it("直接值原样返回", () => {
    expect(resolveToastContent("已保存")).toBe("已保存");
  });

  it("函数值调用后返回结果", () => {
    expect(resolveToastContent(() => "已保存")).toBe("已保存");
  });

  it("undefined 保持 undefined", () => {
    expect(resolveToastContent(undefined)).toBeUndefined();
  });
});

describe("getVerticalAxis", () => {
  it.each([
    ["top-left", "top"],
    ["top-center", "top"],
    ["top-right", "top"],
    ["bottom-left", "bottom"],
    ["bottom-center", "bottom"],
    ["bottom-right", "bottom"],
  ] as const)("%s 的纵向轴是 %s", (position, expected) => {
    expect(getVerticalAxis(position)).toBe(expected);
  });
});

describe("isFrontToast", () => {
  it("index 为 0 是最前面的层", () => {
    expect(isFrontToast(0)).toBe(true);
  });

  it("index 大于 0 不是最前面的层", () => {
    expect(isFrontToast(1)).toBe(false);
    expect(isFrontToast(3)).toBe(false);
  });
});

describe("getCollapsedTransform", () => {
  it("最前层不做堆叠变换", () => {
    expect(
      getCollapsedTransform({ index: 0, gap: 14, position: "top-left" }),
    ).toBeUndefined();
  });

  it("底部堆叠向上让位（负位移）", () => {
    expect(
      getCollapsedTransform({ index: 1, gap: 14, position: "bottom-right" }),
    ).toBe("translateY(calc(-14px)) scale(0.95)");
  });

  it("顶部堆叠向下让位（正位移）", () => {
    expect(
      getCollapsedTransform({ index: 1, gap: 14, position: "top-right" }),
    ).toBe("translateY(calc(14px)) scale(0.95)");
  });

  it("第 2 层位移是 gap 的两倍、缩放 0.9", () => {
    expect(
      getCollapsedTransform({ index: 2, gap: 10, position: "bottom-left" }),
    ).toBe("translateY(calc(-20px)) scale(0.9)");
  });

  it("层数很深时缩放不小于 0.8", () => {
    // 1 - 5 * 0.05 = 0.75，被 Math.max 抬回 0.8
    expect(
      getCollapsedTransform({ index: 5, gap: 8, position: "bottom-left" }),
    ).toBe("translateY(calc(-40px)) scale(0.8)");
  });
});

describe("getToastStyle", () => {
  const base = {
    toast: {} as ToastT,
    total: 3,
    position: "bottom-right" as const,
    gap: 14,
  };

  it("z-index 随层号递减（最前层最高）", () => {
    expect(
      getToastStyle({ ...base, index: 0, expanded: false })["z-index"],
    ).toBe(3);
    expect(
      getToastStyle({ ...base, index: 2, expanded: false })["z-index"],
    ).toBe(1);
  });

  it("折叠态最前层叠在同一格且可接收指针事件", () => {
    const style = getToastStyle({ ...base, index: 0, expanded: false });

    expect(style["grid-area"]).toBe("1 / 1");
    expect(style["align-self"]).toBe("end");
    expect(style["pointer-events"]).toBe("auto");
    expect(style.transform).toBeUndefined();
  });

  it("折叠态后层不接收指针事件并带堆叠变换", () => {
    const style = getToastStyle({ ...base, index: 1, expanded: false });

    expect(style["pointer-events"]).toBe("none");
    expect(style.transform).toBe("translateY(calc(-14px)) scale(0.95)");
  });

  it("顶部位置对齐到 start", () => {
    const style = getToastStyle({
      ...base,
      position: "top-center",
      index: 0,
      expanded: false,
    });

    expect(style["align-self"]).toBe("start");
  });

  it("展开态不写叠放定位（交给容器 flex 排列）", () => {
    const style = getToastStyle({ ...base, index: 1, expanded: true });

    expect(style["grid-area"]).toBeUndefined();
    expect(style["align-self"]).toBeUndefined();
    expect(style.transform).toBeUndefined();
    expect(style["pointer-events"]).toBeUndefined();
  });

  it("toast 自带 style 会被保留，但 z-index 以层级为准", () => {
    const style = getToastStyle({
      ...base,
      toast: { style: { "z-index": 99, color: "red" } } as ToastT,
      index: 0,
      expanded: false,
    });

    expect(style["z-index"]).toBe(3);
    expect(style.color).toBe("red");
  });
});

describe("getAnimationClasses", () => {
  it("底部最前层播放向上滑入/向下滑出", () => {
    const classes = getAnimationClasses({
      index: 0,
      expanded: false,
      position: "bottom-right",
    });

    expect(classes).toContain("data-[state=open]:slide-in-from-bottom-2");
    expect(classes).toContain("data-[state=closed]:slide-out-to-bottom");
  });

  it("顶部最前层播放向下滑入/向上滑出", () => {
    const classes = getAnimationClasses({
      index: 0,
      expanded: false,
      position: "top-left",
    });

    expect(classes).toContain("data-[state=open]:slide-in-from-top-2");
    expect(classes).toContain("data-[state=closed]:slide-out-to-top");
  });

  it("折叠态的非最前层没有动画", () => {
    expect(
      getAnimationClasses({
        index: 1,
        expanded: false,
        position: "bottom-right",
      }),
    ).toBe("");
  });

  it("展开态的非最前层也播放动画", () => {
    expect(
      getAnimationClasses({
        index: 2,
        expanded: true,
        position: "bottom-right",
      }),
    ).toContain("data-[state=open]:animate-in");
  });
});
