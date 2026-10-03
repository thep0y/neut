import { afterEach, describe, expect, it, vi } from "vitest";
import {
  computeTargetTop,
  type TargetTopInput,
  targetTopFor,
} from "~/components/message-scroller/message-scroller.scroll-target";

/** 构造一份可控的测量输入，用例只覆盖自己关心的字段 */
function input(overrides: Partial<TargetTopInput> = {}): TargetTopInput {
  return {
    itemTop: 500,
    itemHeight: 100,
    viewportHeight: 400,
    scrollTop: 300,
    padding: { start: 0, end: 0 },
    margin: 0,
    ...overrides,
  };
}

describe("computeTargetTop - start（默认）", () => {
  it("行顶对齐可视区顶部（减内边距与留白）", () => {
    expect(computeTargetTop("start", input({ itemTop: 500 }))).toBe(500);
  });

  it("减去 padding.start 与 margin", () => {
    expect(
      computeTargetTop(
        "start",
        input({ itemTop: 500, padding: { start: 16, end: 0 }, margin: 8 }),
      ),
    ).toBe(476);
  });

  it("align 未指定时按 start 处理", () => {
    expect(computeTargetTop(undefined, input({ itemTop: 500 }))).toBe(500);
  });
});

describe("computeTargetTop - center", () => {
  it("行居中于可视区", () => {
    // visible = 400；itemTop - 0 - (400 - 100)/2 = 500 - 150 = 350
    expect(computeTargetTop("center", input())).toBe(350);
  });

  it("内边距会从可视高度里扣除", () => {
    // visible = 400 - 20 - 20 = 360；500 - 20 - (360-100)/2 = 500-20-130 = 350
    expect(
      computeTargetTop("center", input({ padding: { start: 20, end: 20 } })),
    ).toBe(350);
  });

  it("内边距大于可视高度时 visible 夹到 0（不产生负可视区）", () => {
    // visible = max(0, 400-300-300) = 0；500 - 300 - (0-100)/2 = 250
    expect(
      computeTargetTop("center", input({ padding: { start: 300, end: 300 } })),
    ).toBe(250);
  });

  it("margin 参与最终偏移", () => {
    // 350 - 25 = 325
    expect(computeTargetTop("center", input({ margin: 25 }))).toBe(325);
  });
});

describe("computeTargetTop - end", () => {
  it("行底对齐可视区底部", () => {
    // 500 - 400 + 100 + 0 + 0 = 200
    expect(computeTargetTop("end", input())).toBe(200);
  });

  it("加上 padding.end 与 margin", () => {
    // 500 - 400 + 100 + 12 + 8 = 220
    expect(
      computeTargetTop(
        "end",
        input({ padding: { start: 0, end: 12 }, margin: 8 }),
      ),
    ).toBe(220);
  });
});

describe("computeTargetTop - nearest", () => {
  it("行完全可见时保持当前 scrollTop 不动", () => {
    // viewTop = 300；viewBottom = 700；item 500..600 在其中
    expect(computeTargetTop("nearest", input())).toBe(300);
  });

  it("行在可视区上方时对齐到顶部", () => {
    // itemTop=100 < viewTop=300 → 100 - 0 - 0 = 100
    expect(computeTargetTop("nearest", input({ itemTop: 100 }))).toBe(100);
  });

  it("行在可视区下方时对齐到底部", () => {
    // bottom = 800 > viewBottom = 700
    // 800 - 400 + 0 + 0 = 400
    expect(computeTargetTop("nearest", input({ itemTop: 700 }))).toBe(400);
  });

  it("上方溢出时减 padding.start 与 margin", () => {
    // 100 - 10 - 5 = 85
    expect(
      computeTargetTop(
        "nearest",
        input({ itemTop: 100, padding: { start: 10, end: 0 }, margin: 5 }),
      ),
    ).toBe(85);
  });

  it("下方溢出时加 padding.end 与 margin", () => {
    // 800 - 400 + 10 + 5 = 415
    expect(
      computeTargetTop(
        "nearest",
        input({ itemTop: 700, padding: { start: 0, end: 10 }, margin: 5 }),
      ),
    ).toBe(415);
  });

  it("边界：itemTop 恰好等于 viewTop 时视为可见", () => {
    expect(computeTargetTop("nearest", input({ itemTop: 300 }))).toBe(300);
  });
});

describe("targetTopFor", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  /** 构造带尺寸的 viewport / content / 行元素 */
  function setup() {
    const viewport = document.createElement("div");
    Object.defineProperty(viewport, "clientHeight", {
      configurable: true,
      value: 400,
    });
    Object.defineProperty(viewport, "scrollTop", {
      configurable: true,
      writable: true,
      value: 300,
    });

    const content = document.createElement("div");
    const item = document.createElement("div");
    item.getBoundingClientRect = () =>
      ({
        height: 100,
        top: 0,
        bottom: 100,
        left: 0,
        right: 0,
        width: 0,
      }) as DOMRect;

    return { viewport, content, item };
  }

  it("从元素与视口读取真实尺寸并算出目标位置", () => {
    const { viewport, content, item } = setup();
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      paddingBlockStart: "0px",
      paddingBlockEnd: "0px",
    } as unknown as CSSStyleDeclaration);

    const result = targetTopFor(
      item,
      { align: "start" },
      0,
      viewport,
      content,
      () => 500,
    );

    expect(result).toBe(500);
  });

  it("content 缺失时按零内边距计算", () => {
    const { viewport, item } = setup();

    const result = targetTopFor(
      item,
      { align: "end" },
      0,
      viewport,
      undefined,
      () => 500,
    );

    expect(result).toBe(200);
  });

  it("align 缺省时按 start 处理", () => {
    const { viewport, content, item } = setup();
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      paddingBlockStart: "0px",
      paddingBlockEnd: "0px",
    } as unknown as CSSStyleDeclaration);

    expect(targetTopFor(item, undefined, 0, viewport, content, () => 500)).toBe(
      500,
    );
  });

  it("margin 透传到计算中", () => {
    const { viewport, content, item } = setup();
    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      paddingBlockStart: "0px",
      paddingBlockEnd: "0px",
    } as unknown as CSSStyleDeclaration);

    expect(
      targetTopFor(item, { align: "start" }, 30, viewport, content, () => 500),
    ).toBe(470);
  });
});
