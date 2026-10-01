import { afterEach, describe, expect, it, vi } from "vitest";
import type { Position } from "../Toast/Toast.types";
import {
  getDefaultSwipeDirections,
  getDocumentDirection,
  getPositionClass,
  resolveOffsetStyle,
} from "./Toaster.utils";

describe("getPositionClass", () => {
  it.each([
    ["top-left", "top-0 left-0"],
    ["top-right", "top-0 right-0"],
    ["top-center", "top-0 left-1/2 -translate-x-1/2"],
    ["bottom-left", "bottom-0 left-0"],
    ["bottom-right", "bottom-0 right-0"],
    ["bottom-center", "bottom-0 left-1/2 -translate-x-1/2"],
  ] as const)("%s 对应 %s", (position, expected) => {
    expect(getPositionClass(position)).toBe(expected);
  });
});

describe("resolveOffsetStyle", () => {
  it("默认使用 24px 视口偏移", () => {
    const style = resolveOffsetStyle("top-left");

    expect(style.top).toBe("24px");
    expect(style.left).toBe("24px");
  });

  it("默认移动端偏移为 16px", () => {
    const style = resolveOffsetStyle("top-left");

    expect(style["--mobile-offset-top"]).toBe("16px");
    expect(style["--mobile-offset-left"]).toBe("16px");
  });

  it("bottom-* 写 bottom 而不是 top", () => {
    const style = resolveOffsetStyle("bottom-right");

    expect(style.bottom).toBe("24px");
    expect(style.right).toBe("24px");
    expect(style.top).toBeUndefined();
  });

  it("center 位置不写水平偏移", () => {
    const style = resolveOffsetStyle("top-center");

    expect(style.left).toBeUndefined();
    expect(style.right).toBeUndefined();
    // 但仍会写纵向
    expect(style.top).toBe("24px");
  });

  it("数字 offset 转成 px", () => {
    const style = resolveOffsetStyle("top-left", 8);

    expect(style.top).toBe("8px");
    expect(style.left).toBe("8px");
  });

  it("字符串 offset 原样使用", () => {
    const style = resolveOffsetStyle("top-left", "1rem");

    expect(style.top).toBe("1rem");
    expect(style.left).toBe("1rem");
  });

  it("0 是合法 offset（不会被默认值顶替）", () => {
    const style = resolveOffsetStyle("top-left", 0);

    expect(style.top).toBe("0px");
    expect(style.left).toBe("0px");
  });

  it("对象 offset 支持分方向设置", () => {
    const style = resolveOffsetStyle("top-left", { top: 4, left: 8 });

    expect(style.top).toBe("4px");
    expect(style.left).toBe("8px");
  });

  it("对象 offset 缺省的边回退到 24px", () => {
    const style = resolveOffsetStyle("top-left", { top: 4 });

    expect(style.top).toBe("4px");
    expect(style.left).toBe("24px");
  });

  it("mobileOffset 独立于 desktop offset", () => {
    const style = resolveOffsetStyle("top-left", 10, 2);

    expect(style.top).toBe("10px");
    expect(style["--mobile-offset-top"]).toBe("2px");
  });

  it("对象 offset 只给一边时，另一边回退到 24px", () => {
    const topLeft = resolveOffsetStyle("top-left", { left: 8 });
    expect(topLeft.top).toBe("24px");
    expect(topLeft.left).toBe("8px");

    const bottomRight = resolveOffsetStyle("bottom-right", { right: 3 });
    expect(bottomRight.bottom).toBe("24px");
    expect(bottomRight.right).toBe("3px");
  });

  it("mobileOffset 缺省时用 16px", () => {
    const style = resolveOffsetStyle("top-left", 10);

    expect(style["--mobile-offset-top"]).toBe("16px");
  });

  it("对象 offset 缺 right 时回退到 24px（bottom-right）", () => {
    const style = resolveOffsetStyle("bottom-right", { bottom: 1 });

    expect(style.bottom).toBe("1px");
    expect(style.right).toBe("24px");
  });

  it("对象 mobileOffset 缺 bottom 时回退到 16px", () => {
    const style = resolveOffsetStyle("bottom-right", 10, { right: 2 });

    expect(style["--mobile-offset-bottom"]).toBe("16px");
    expect(style["--mobile-offset-right"]).toBe("2px");
  });

  it("对象 mobileOffset 只给一边时，其余边回退到 16px", () => {
    const topLeft = resolveOffsetStyle("top-left", 10, { left: 2 });
    expect(topLeft["--mobile-offset-top"]).toBe("16px");
    expect(topLeft["--mobile-offset-left"]).toBe("2px");

    const bottomRight = resolveOffsetStyle("bottom-right", 10, {
      bottom: 2,
    });
    expect(bottomRight["--mobile-offset-bottom"]).toBe("2px");
    expect(bottomRight["--mobile-offset-right"]).toBe("16px");
  });

  it("mobileOffset 对象缺省的边回退到 16px", () => {
    const style = resolveOffsetStyle("top-left", undefined, { top: 5 });

    expect(style["--mobile-offset-top"]).toBe("5px");
    expect(style["--mobile-offset-left"]).toBe("16px");
  });

  it("null offset 视为缺省（走默认值）", () => {
    const style = resolveOffsetStyle("top-left", null as never);

    expect(style.top).toBe("24px");
  });

  it("bottom-left 同时写 bottom 与 left（含 mobile 变量）", () => {
    const style = resolveOffsetStyle("bottom-left", "2rem", "1rem");

    expect(style.bottom).toBe("2rem");
    expect(style.left).toBe("2rem");
    expect(style["--mobile-offset-bottom"]).toBe("1rem");
    expect(style["--mobile-offset-left"]).toBe("1rem");
  });

  it("bottom-right 写 bottom 与 right", () => {
    const style = resolveOffsetStyle("bottom-right", 12);

    expect(style.bottom).toBe("12px");
    expect(style.right).toBe("12px");
    expect(style["--mobile-offset-bottom"]).toBe("16px");
    expect(style["--mobile-offset-right"]).toBe("16px");
  });

  it("bottom-center 只写纵向（不写 left/right）", () => {
    const style = resolveOffsetStyle("bottom-center", 12);

    expect(style.bottom).toBe("12px");
    expect(style.left).toBeUndefined();
    expect(style.right).toBeUndefined();
    expect(style["--mobile-offset-left"]).toBeUndefined();
    expect(style["--mobile-offset-right"]).toBeUndefined();
  });

  it("top-right 写 top 与 right", () => {
    const style = resolveOffsetStyle("top-right", 5);

    expect(style.top).toBe("5px");
    expect(style.right).toBe("5px");
  });

  it("对象 offset 的 bottom/right 也可单独指定", () => {
    const style = resolveOffsetStyle("bottom-right", { bottom: 3, right: 7 });

    expect(style.bottom).toBe("3px");
    expect(style.right).toBe("7px");
  });

  it("对象 mobileOffset 覆盖对应边", () => {
    const style = resolveOffsetStyle("bottom-right", 10, {
      bottom: 1,
      right: 2,
    });

    expect(style["--mobile-offset-bottom"]).toBe("1px");
    expect(style["--mobile-offset-right"]).toBe("2px");
  });
});

describe("getDefaultSwipeDirections", () => {
  it("top-left 支持向上与向左滑动", () => {
    expect(getDefaultSwipeDirections("top-left")).toEqual(["top", "left"]);
  });

  it("bottom-right 支持向下与向右滑动", () => {
    expect(getDefaultSwipeDirections("bottom-right")).toEqual([
      "bottom",
      "right",
    ]);
  });

  it("top-center 只返回 top（不含非法的 center 方向）", () => {
    // 回归：此前实现会把 "center" 直接 as SwipeDirection 塞进结果，
    // 产出 ["top", "center"]，而 "center" 不在 SwipeDirection 联合类型里。
    expect(getDefaultSwipeDirections("top-center")).toEqual(["top"]);
  });

  it("bottom-center 只返回 bottom", () => {
    expect(getDefaultSwipeDirections("bottom-center")).toEqual(["bottom"]);
  });

  it("返回的每一项都是合法的 SwipeDirection", () => {
    const valid = ["top", "right", "bottom", "left"];
    const positions = [
      "top-left",
      "top-center",
      "top-right",
      "bottom-left",
      "bottom-center",
      "bottom-right",
    ] as const;

    for (const position of positions) {
      for (const direction of getDefaultSwipeDirections(position)) {
        expect(valid).toContain(direction);
      }
    }
  });

  it("纵向轴非法时（JS 调用方传入越界值）不产出任何方向", () => {
    // Position 是编译期约束；运行时可能收到非法字符串，这里守住兜底行为
    expect(getDefaultSwipeDirections("left-center" as Position)).toEqual([]);
  });
});

describe("getDocumentDirection", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("dir");
    document.documentElement.style.direction = "";
  });

  it("documentElement 有 dir 属性时直接使用", () => {
    document.documentElement.setAttribute("dir", "rtl");

    expect(getDocumentDirection()).toBe("rtl");
  });

  it("dir=auto 时回退到计算样式", () => {
    document.documentElement.setAttribute("dir", "auto");
    document.documentElement.style.direction = "rtl";

    expect(getDocumentDirection()).toBe("rtl");
  });

  it("无 dir 属性时回退到计算样式", () => {
    document.documentElement.style.direction = "rtl";

    expect(getDocumentDirection()).toBe("rtl");
  });

  it("计算样式缺省时按 ltr 处理", () => {
    expect(getDocumentDirection()).toBe("ltr");
  });

  it("没有 document 的环境返回 ltr（SSR 兜底）", () => {
    vi.stubGlobal("document", undefined);
    try {
      expect(getDocumentDirection()).toBe("ltr");
    } finally {
      // 必须在本文件 afterEach 触碰 document 之前还原
      vi.unstubAllGlobals();
    }
  });
});
