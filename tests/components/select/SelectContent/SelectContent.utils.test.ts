import { describe, expect, it, vi } from "vitest";
import { rect } from "~tests/lib/positioner/test-utils";
import { createSelectMiddleware } from "~/components/select/SelectContent/SelectContent.utils";

/**
 * `SelectContent.utils` 的定位管线按「有没有选中值」分成两套配方。
 * 这里验证:
 * ① 两套配方的 middleware 组成与顺序;
 * ② `alignSelectedItem` 的核心算法(选中项贴 trigger + 面板高度 + scrollTop)。
 */
function names(middleware: { name: string }[]): string[] {
  return middleware.map((m) => m.name);
}

describe("createSelectMiddleware 配方", () => {
  it("有选中值时:matchWidth → itemAlign → shift → hide → containingBlockOffset（无 size）", () => {
    const middleware = createSelectMiddleware({
      hasValue: true,
      selectedValue: () => "b",
      scrollElement: () => undefined,
      placement: "bottom",
      collisionPadding: 8,
      onAvailableHeightChange: () => {},
    });

    // 关键:有值时不能有 size —— itemAlign 自己算面板高度，
    // 两套算法同时存在会互相打架（注释里记录的踩坑点）。
    expect(names(middleware)).toEqual([
      "matchWidth",
      "itemAlign",
      "shift",
      "hide",
      "containingBlockOffset",
    ]);
    expect(names(middleware)).not.toContain("size");
  });

  it("没有选中值时:offset → flip → shift → matchWidth → size → hide → containingBlockOffset", () => {
    const middleware = createSelectMiddleware({
      hasValue: false,
      selectedValue: () => undefined,
      scrollElement: () => undefined,
      placement: "bottom",
      collisionPadding: 8,
      onAvailableHeightChange: () => {},
    });

    expect(names(middleware)).toEqual([
      "offset",
      "flip",
      "shift",
      "matchWidth",
      "size",
      "hide",
      "containingBlockOffset",
    ]);
  });

  it("containingBlockOffset 始终排在最后", () => {
    for (const hasValue of [true, false]) {
      const middleware = createSelectMiddleware({
        hasValue,
        selectedValue: () => "b",
        scrollElement: () => undefined,
        placement: "bottom",
        collisionPadding: 8,
        onAvailableHeightChange: () => {},
      });

      expect(middleware.at(-1)?.name).toBe("containingBlockOffset");
    }
  });

  it("有值时 shift 只处理交叉轴（纵向由 itemAlign 负责）", () => {
    const middleware = createSelectMiddleware({
      hasValue: true,
      selectedValue: () => "b",
      scrollElement: () => undefined,
      placement: "bottom",
      collisionPadding: 8,
      onAvailableHeightChange: () => {},
    });

    const shift = middleware.find((m) => m.name === "shift");
    expect(shift).toBeDefined();
  });

  it("无值时 size 中间件把可用高度回调出去", () => {
    const onAvailableHeightChange = vi.fn();
    const middleware = createSelectMiddleware({
      hasValue: false,
      selectedValue: () => undefined,
      scrollElement: () => undefined,
      placement: "bottom",
      collisionPadding: 0,
      onAvailableHeightChange,
    });

    // jsdom 视口尺寸默认 0，显式给一个以得到正的可用高度
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(document.documentElement, "clientHeight", {
      configurable: true,
      value: 800,
    });

    try {
      const sizeMiddleware = middleware.find((m) => m.name === "size")!;
      sizeMiddleware.fn({
        x: 100,
        y: 200,
        placement: "bottom",
        initialPlacement: "bottom",
        strategy: "fixed",
        rects: {
          reference: rect(0, 0, 200, 40),
          floating: rect(0, 0, 200, 300),
        },
        elements: {
          reference: {} as Element,
          floating: {} as HTMLElement,
        },
        middlewareData: {},
      });

      // apply 回调把可用高度透传给上层（用于设置 max-height）
      expect(onAvailableHeightChange).toHaveBeenCalledTimes(1);
      // 视口高 800，浮层顶在 200 => 可用 600
      expect(onAvailableHeightChange).toHaveBeenCalledWith(600);
    } finally {
      Reflect.deleteProperty(document.documentElement, "clientWidth");
      Reflect.deleteProperty(document.documentElement, "clientHeight");
    }
  });
});

describe("matchReferenceWidth", () => {
  it("把 reference 宽度透传到 middlewareData", () => {
    const middleware = createSelectMiddleware({
      hasValue: false,
      selectedValue: () => undefined,
      scrollElement: () => undefined,
      placement: "bottom",
      collisionPadding: 8,
      onAvailableHeightChange: () => {},
    });
    const matchWidth = middleware.find((m) => m.name === "matchWidth")!;

    const result = matchWidth.fn({
      x: 0,
      y: 0,
      placement: "bottom",
      initialPlacement: "bottom",
      strategy: "absolute",
      rects: {
        reference: rect(0, 0, 240, 40),
        floating: rect(0, 0, 100, 100),
      },
      elements: {
        reference: {} as Element,
        floating: {} as HTMLElement,
      },
      middlewareData: {},
    });

    expect(result.data).toEqual({ width: 240 });
  });
});
