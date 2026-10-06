import { describe, expect, it } from "vitest";
import {
  createFloatingMiddleware,
  getTransformOrigin,
  toPhysicalSide,
  toPlacement,
} from "~/lib/positioner/utils/floating";

/**
 * 浮层共用定位管线与几个纯函数助手。
 *
 * `createFloatingMiddleware` 的返回值是 middleware 数组，这里只断言
 * **组成与顺序**（offset → flip → shift → [arrow] → hide → containingBlockOffset），
 * 以及可选参数的默认值分支；真正的几何计算由各 middleware 自己的测试覆盖。
 */
function names(options: Parameters<typeof createFloatingMiddleware>[0]) {
  return createFloatingMiddleware(options).map((m) => m.name);
}

describe("createFloatingMiddleware", () => {
  it("基础管线的顺序固定", () => {
    const list = names({ sideOffset: 4 });

    expect(list).toEqual([
      "offset",
      "flip",
      "shift",
      "hide",
      "containingBlockOffset",
    ]);
  });

  it("没有 arrowElement 时不加入 arrow", () => {
    expect(names({ sideOffset: 0 })).not.toContain("arrow");
  });

  it("提供 arrowElement 时在 flip/shift 之后插入 arrow", () => {
    const list = names({
      sideOffset: 4,
      arrowElement: () => document.createElement("div"),
    });

    expect(list).toEqual([
      "offset",
      "flip",
      "shift",
      "arrow",
      "hide",
      "containingBlockOffset",
    ]);
  });

  it("可选的内边距参数省略时走默认值，不抛错", () => {
    expect(() => createFloatingMiddleware({ sideOffset: 8 })).not.toThrow();
  });

  it("显式传入 alignOffset / collisionPadding / arrowPadding 时同样可用", () => {
    expect(() =>
      createFloatingMiddleware({
        sideOffset: 8,
        alignOffset: 12,
        collisionPadding: 16,
        arrowElement: () => document.createElement("div"),
        arrowPadding: 3,
      }),
    ).not.toThrow();
  });
});

describe("toPhysicalSide", () => {
  it("物理方向原样返回", () => {
    expect(toPhysicalSide("top")).toBe("top");
    expect(toPhysicalSide("bottom")).toBe("bottom");
    expect(toPhysicalSide("left")).toBe("left");
    expect(toPhysicalSide("right")).toBe("right");
  });

  it("inline-start / inline-end 按书写方向映射", () => {
    expect(toPhysicalSide("inline-start", "ltr")).toBe("left");
    expect(toPhysicalSide("inline-end", "ltr")).toBe("right");
    expect(toPhysicalSide("inline-start", "rtl")).toBe("right");
    expect(toPhysicalSide("inline-end", "rtl")).toBe("left");
  });

  it("默认按 ltr 处理", () => {
    expect(toPhysicalSide("inline-start")).toBe("left");
  });
});

describe("toPlacement", () => {
  it("由 side 与 align 组装出 placement", () => {
    expect(toPlacement("top", "start")).toBe("top-start");
    expect(toPlacement("bottom", "end")).toBe("bottom-end");
  });

  it("align=center 时省略后缀", () => {
    expect(toPlacement("top", "center")).toBe("top");
  });

  it("inline-start / inline-end 先转物理方向再拼 align", () => {
    expect(toPlacement("inline-start", "start", "ltr")).toBe("left-start");
    expect(toPlacement("inline-end", "end", "rtl")).toBe("left-end");
    expect(toPlacement("inline-start", "center", "rtl")).toBe("right");
  });
});

describe("getTransformOrigin", () => {
  it("缩放锚点落在贴近 trigger 的那条边（不是几何中心）", () => {
    // 纵向：top 的锚点在底边，bottom 在顶边；cross 由 align 决定
    expect(getTransformOrigin("top")).toBe("50% 100%");
    expect(getTransformOrigin("top-start")).toBe("0% 100%");
    expect(getTransformOrigin("top-end")).toBe("100% 100%");
    expect(getTransformOrigin("bottom")).toBe("50% 0%");
    expect(getTransformOrigin("bottom-start")).toBe("0% 0%");
  });

  it("横向：锚点落在左/右边", () => {
    expect(getTransformOrigin("left")).toBe("100% 50%");
    expect(getTransformOrigin("left-start")).toBe("100% 0%");
    expect(getTransformOrigin("right")).toBe("0% 50%");
    expect(getTransformOrigin("right-end")).toBe("0% 100%");
  });
});
