import { afterEach, describe, expect, it } from "vitest";
import { rect } from "~tests/lib/positioner/test-utils";
import {
  runItemAlign,
  setupScrollElement,
  withTallViewport,
} from "~tests/components/select/SelectContent/align-selected-item.helpers";

/**
 * `alignSelectedItem` 是 Select 的核心算法:让选中项精确覆盖在 trigger 上方,
 * 并同时定出面板高度与 scrollTop。注释里记录了这个算法经过两版失败尝试
 * (面板与 trigger 之间留空隙 / 选中项被推到边缘),所以这里重点覆盖
 * 那些"走了弯路才发现"的性质。
 */
describe("alignSelectedItem", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  function standardScrollEl(
    options: Partial<Parameters<typeof setupScrollElement>[0]> = {},
  ) {
    return setupScrollElement({
      itemOffsetTop: 0,
      itemHeight: 32,
      scrollHeight: 320,
      ...options,
    });
  }

  it("没有选中值时不做任何事", () => {
    const result = runItemAlign({
      selectedValue: null,
      scrollEl: undefined,
      referenceRect: rect(100, 100, 200, 40),
    });

    expect(result).toEqual({});
  });

  it("缺少滚动容器时不做任何事", () => {
    const result = runItemAlign({
      selectedValue: "b",
      scrollEl: undefined,
      referenceRect: rect(100, 100, 200, 40),
    });

    expect(result).toEqual({});
  });

  it("找不到对应 data-value 的选项时不做任何事", () => {
    const { restore, scrollEl } = standardScrollEl();

    try {
      withTallViewport(() => {
        const result = runItemAlign({
          selectedValue: "not-exist",
          scrollEl,
          referenceRect: rect(100, 100, 200, 40),
        });

        expect(result).toEqual({});
      });
    } finally {
      restore();
    }
  });

  it("x 对齐到 trigger 左边缘", () => {
    const { restore, scrollEl } = standardScrollEl();

    try {
      withTallViewport(() => {
        const result = runItemAlign({
          selectedValue: "b",
          scrollEl,
          referenceRect: rect(150, 100, 200, 40),
        });

        expect(result.x).toBe(150);
      });
    } finally {
      restore();
    }
  });

  it("产出 aligned 标记与数值型 panelHeight", () => {
    const { restore, scrollEl } = standardScrollEl();

    try {
      withTallViewport(() => {
        const result = runItemAlign({
          selectedValue: "b",
          scrollEl,
          referenceRect: rect(0, 300, 200, 40),
        });

        expect(result.data).toMatchObject({ aligned: true });
        expect(
          typeof (result.data as { panelHeight: number }).panelHeight,
        ).toBe("number");
      });
    } finally {
      restore();
    }
  });

  it("会设置 scrollEl.scrollTop（纯 DOM 副作用）", () => {
    const { restore, scrollEl } = standardScrollEl({ itemOffsetTop: 160 });

    try {
      withTallViewport(() => {
        runItemAlign({
          selectedValue: "b",
          scrollEl,
          referenceRect: rect(0, 300, 200, 40),
        });

        expect(scrollEl.scrollTop).toBeGreaterThanOrEqual(0);
      });
    } finally {
      restore();
    }
  });

  it("选中第一项时上方不展开，scrollTop 为 0", () => {
    const { restore, scrollEl } = standardScrollEl();

    try {
      withTallViewport(() => {
        const result = runItemAlign({
          selectedValue: "b",
          scrollEl,
          referenceRect: rect(0, 300, 200, 40),
        });

        expect(scrollEl.scrollTop).toBe(0);
        expect(result.y).toBeDefined();
      });
    } finally {
      restore();
    }
  });

  it("选中最后一项时下方不展开，面板整体上移（scrollTop 仍为 0）", () => {
    const { restore, scrollEl } = standardScrollEl({ itemOffsetTop: 288 });

    try {
      withTallViewport(() => {
        const result = runItemAlign({
          selectedValue: "b",
          scrollEl,
          referenceRect: rect(0, 300, 200, 40),
        });

        // 关键性质：下方没有内容（contentBelow=0）=> expandBelow=0；
        // 上方空间足够 => expandAbove 吃满 288，于是 scrollTop = 288 - 288 = 0，
        // 面板整体上移让"最后一项"不需要滚动就贴在 trigger 上
        // —— 这正是注释里说的"两端自动退化成正确行为"。
        expect(scrollEl.scrollTop).toBe(0);
        // idealItemTop = 300 + 20 - 16 = 304；panelTop = 304 - 288 = 16
        expect(result.y).toBe(16);
      });
    } finally {
      restore();
    }
  });
});
