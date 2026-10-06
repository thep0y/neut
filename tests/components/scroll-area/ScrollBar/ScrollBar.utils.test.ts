import { describe, expect, it } from "vitest";
import type { ScrollMetrics } from "~/components/scroll-area/ScrollArea/ScrollArea.types";
import {
  applyScrollPos,
  computeAriaValueNow,
  computeThumbStyle,
  isScrollBarVisible,
  isVertical,
  KEYBOARD_STEP_PX,
  keyboardScrollDelta,
  maxScrollOf,
  MIN_THUMB_PX,
  pointerCoord,
  scrollFromDrag,
  scrollFromKeyboard,
  scrollFromTrackClick,
  scrollPosOf,
  TRACK_PADDING_PX,
  thumbDragRatio,
} from "~/components/scroll-area/ScrollBar/ScrollBar.utils";

/** 构造一个已知的 metrics 快照 */
function metrics(overrides: Partial<ScrollMetrics> = {}): ScrollMetrics {
  return { thumbRatio: 1, thumbOffset: 0, scrollable: false, ...overrides };
}

/** 构造一个只带指定滚动属性的假 viewport */
function fakeViewport(size: {
  clientHeight?: number;
  scrollHeight?: number;
  clientWidth?: number;
  scrollWidth?: number;
  scrollTop?: number;
  scrollLeft?: number;
}): HTMLElement {
  const el = document.createElement("div");
  // jsdom 里这些尺寸/位置属性只有 getter，必须用 defineProperty 覆盖
  for (const [key, value] of Object.entries(size)) {
    Object.defineProperty(el, key, {
      configurable: true,
      writable: true,
      value,
    });
  }
  return el;
}

/** 构造一个只用到坐标字段的 PointerEvent */
function pointer(coords: { clientX?: number; clientY?: number }): PointerEvent {
  return coords as unknown as PointerEvent;
}

describe("ScrollBar.utils - 常量与轴向判断", () => {
  it("最小滑块长度是 20px", () => {
    expect(MIN_THUMB_PX).toBe(20);
  });

  it("track 内边距是 2px（对应 p-px）", () => {
    expect(TRACK_PADDING_PX).toBe(2);
  });

  it("键盘步长是 40px", () => {
    expect(KEYBOARD_STEP_PX).toBe(40);
  });

  it("vertical 判定 true，horizontal 判定 false", () => {
    expect(isVertical("vertical")).toBe(true);
    expect(isVertical("horizontal")).toBe(false);
  });
});

describe("ScrollBar.utils - computeThumbStyle", () => {
  it("竖向：按比例给出高度并用 translateY 定位", () => {
    // track 202px → 内容区 200px；比例 0.5 → 滑块 100px；偏移 0.5 → (200-100)*0.5 = 50
    const style = computeThumbStyle(
      "vertical",
      metrics({ thumbRatio: 0.5, thumbOffset: 0.5 }),
      202,
    );

    expect(style).toEqual({ height: "100px", transform: "translateY(50px)" });
  });

  it("横向：按比例给出宽度并用 translateX 定位", () => {
    const style = computeThumbStyle(
      "horizontal",
      metrics({ thumbRatio: 0.25, thumbOffset: 1 }),
      102,
    );

    // 内容区 100px；滑块 25px；偏移 1 → (100-25)*1 = 75
    expect(style).toEqual({ width: "25px", transform: "translateX(75px)" });
  });

  it("比例过小时夹到最小长度，且位移按夹住后的可用空间重算", () => {
    // 内容区 1000px；比例 0.001 → 1px 被夹到 20px；可用空间 980；偏移 0.5 → 490
    const style = computeThumbStyle(
      "vertical",
      metrics({ thumbRatio: 0.001, thumbOffset: 0.5 }),
      1002,
    );

    expect(style).toEqual({ height: "20px", transform: "translateY(490px)" });
  });

  it("滑块长于 track 时位移夹到 0（不出现负偏移）", () => {
    // 内容区 0px（trackSize 小于内边距）→ 滑块 = MIN_THUMB_PX，可用空间 0
    const style = computeThumbStyle(
      "vertical",
      metrics({ thumbRatio: 1, thumbOffset: 1 }),
      0,
    );

    expect(style).toEqual({ height: "20px", transform: "translateY(0px)" });
  });

  it("偏移始终落在 [0, 可用空间]（0 与 1 两端）", () => {
    const atStart = computeThumbStyle(
      "vertical",
      metrics({ thumbRatio: 0.5, thumbOffset: 0 }),
      202,
    );
    const atEnd = computeThumbStyle(
      "vertical",
      metrics({ thumbRatio: 0.5, thumbOffset: 1 }),
      202,
    );

    expect(atStart.transform).toBe("translateY(0px)");
    expect(atEnd.transform).toBe("translateY(100px)");
  });
});

describe("ScrollBar.utils - computeAriaValueNow", () => {
  it("0% 滚动位置得到 0", () => {
    expect(computeAriaValueNow(metrics({ thumbOffset: 0 }))).toBe(0);
  });

  it("100% 滚动位置得到 100", () => {
    expect(computeAriaValueNow(metrics({ thumbOffset: 1 }))).toBe(100);
  });

  it("四舍五入到整数（0.336 → 34）", () => {
    expect(computeAriaValueNow(metrics({ thumbOffset: 0.336 }))).toBe(34);
  });

  it("临界向下取整（0.334 → 33）", () => {
    expect(computeAriaValueNow(metrics({ thumbOffset: 0.334 }))).toBe(33);
  });
});

describe("ScrollBar.utils - 轴向读写", () => {
  it("竖向读取 clientY / scrollTop / 高度差", () => {
    const vp = fakeViewport({
      clientHeight: 400,
      scrollHeight: 1000,
      scrollTop: 120,
      clientWidth: 300,
      scrollWidth: 900,
      scrollLeft: 40,
    });

    expect(pointerCoord("vertical", pointer({ clientX: 1, clientY: 7 }))).toBe(
      7,
    );
    expect(scrollPosOf("vertical", vp)).toBe(120);
    expect(maxScrollOf("vertical", vp)).toBe(600);
  });

  it("横向读取 clientX / scrollLeft / 宽度差", () => {
    const vp = fakeViewport({
      clientHeight: 400,
      scrollHeight: 1000,
      scrollTop: 120,
      clientWidth: 300,
      scrollWidth: 900,
      scrollLeft: 40,
    });

    expect(
      pointerCoord("horizontal", pointer({ clientX: 1, clientY: 7 })),
    ).toBe(1);
    expect(scrollPosOf("horizontal", vp)).toBe(40);
    expect(maxScrollOf("horizontal", vp)).toBe(600);
  });

  it("竖向写回 scrollTop，不动 scrollLeft", () => {
    const vp = fakeViewport({ scrollTop: 0, scrollLeft: 0 });

    applyScrollPos("vertical", vp, 88);

    expect(vp.scrollTop).toBe(88);
    expect(vp.scrollLeft).toBe(0);
  });

  it("横向写回 scrollLeft，不动 scrollTop", () => {
    const vp = fakeViewport({ scrollTop: 0, scrollLeft: 0 });

    applyScrollPos("horizontal", vp, 55);

    expect(vp.scrollLeft).toBe(55);
    expect(vp.scrollTop).toBe(0);
  });
});

describe("ScrollBar.utils - 拖动换算", () => {
  it("比例 = 可滚动距离 / 可用轨道长度", () => {
    // 可用轨道 = 202 - 2 - 100 = 100px；600 / 100 = 6
    expect(thumbDragRatio(600, 202, 100)).toBe(6);
  });

  it("滑块占满可用轨道时分母为 0，退化为 1 而不是 Infinity", () => {
    // 可用轨道 = 102 - 2 - 100 = 0
    expect(thumbDragRatio(600, 102, 100)).toBe(1);
  });

  it("位移按比例放大后叠加到起始滚动位置", () => {
    expect(scrollFromDrag(100, 10, 6, 600)).toBe(160);
  });

  it("结果夹在 [0, maxScroll] 两端", () => {
    expect(scrollFromDrag(100, -1000, 6, 600)).toBe(0);
    expect(scrollFromDrag(100, 1000, 6, 600)).toBe(600);
  });
});

describe("ScrollBar.utils - scrollFromTrackClick", () => {
  it("竖向：点击位置比例 × 可滚动距离", () => {
    const rect = { top: 100, left: 0, height: 200, width: 20 };

    // (300 - 100) / 200 = 1 → 600
    expect(
      scrollFromTrackClick("vertical", rect, pointer({ clientY: 300 }), 600),
    ).toBe(600);
    // (200 - 100) / 200 = 0.5 → 300
    expect(
      scrollFromTrackClick("vertical", rect, pointer({ clientY: 200 }), 600),
    ).toBe(300);
  });

  it("横向：用 clientX 与 rect.left / width", () => {
    const rect = { top: 0, left: 50, height: 20, width: 100 };

    // (100 - 50) / 100 = 0.5 → 300
    expect(
      scrollFromTrackClick("horizontal", rect, pointer({ clientX: 100 }), 600),
    ).toBe(300);
  });

  it("track 尺寸为 0（jsdom 无布局）时返回 0，不产生 NaN", () => {
    const rect = { top: 0, left: 0, height: 0, width: 0 };

    expect(
      scrollFromTrackClick("vertical", rect, pointer({ clientY: 5 }), 600),
    ).toBe(0);
  });
});

describe("ScrollBar.utils - keyboardScrollDelta", () => {
  it("方向键按固定步长返回正负值", () => {
    expect(keyboardScrollDelta("ArrowDown", 400)).toBe(40);
    expect(keyboardScrollDelta("ArrowRight", 400)).toBe(40);
    expect(keyboardScrollDelta("ArrowUp", 400)).toBe(-40);
    expect(keyboardScrollDelta("ArrowLeft", 400)).toBe(-40);
  });

  it("PageUp / PageDown 用传入的页大小", () => {
    expect(keyboardScrollDelta("PageDown", 400)).toBe(400);
    expect(keyboardScrollDelta("PageUp", 400)).toBe(-400);
  });

  it("Home / End 用 ±Infinity 表示两端", () => {
    expect(keyboardScrollDelta("Home", 400)).toBe(-Infinity);
    expect(keyboardScrollDelta("End", 400)).toBe(Infinity);
  });

  it("未识别的按键返回 undefined", () => {
    expect(keyboardScrollDelta("Enter", 400)).toBeUndefined();
  });
});

describe("ScrollBar.utils - scrollFromKeyboard", () => {
  it("普通增量叠加到当前位置并夹在 [0, max]", () => {
    expect(scrollFromKeyboard(100, 40, 600, 1000)).toBe(140);
    expect(scrollFromKeyboard(0, -40, 600, 1000)).toBe(0);
    expect(scrollFromKeyboard(590, 40, 600, 1000)).toBe(600);
  });

  it("End(Infinity) 落到内容长度，Home(-Infinity) 落到 0", () => {
    expect(scrollFromKeyboard(100, Infinity, 600, 1000)).toBe(1000);
    expect(scrollFromKeyboard(100, -Infinity, 600, 1000)).toBe(0);
  });
});

describe("ScrollBar.utils - isScrollBarVisible", () => {
  it("悬停时可见", () => {
    expect(isScrollBarVisible(true, null, "vertical", false)).toBe(true);
  });

  it("拖动当前轴时可见", () => {
    expect(isScrollBarVisible(false, "vertical", "vertical", false)).toBe(true);
  });

  it("拖动的是另一个轴时不可见", () => {
    expect(isScrollBarVisible(false, "horizontal", "vertical", false)).toBe(
      false,
    );
  });

  it("滑块被按压（active）时可见", () => {
    expect(isScrollBarVisible(false, null, "vertical", true)).toBe(true);
  });

  it("三者都不满足时不可见", () => {
    expect(isScrollBarVisible(false, null, "vertical", false)).toBe(false);
  });
});
