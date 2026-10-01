import { describe, expect, it, vi } from "vitest";
import {
  constraintBounds,
  effectiveMin,
  isCollapsedSize,
  pairConstraintsOf,
} from "./resizable.constraints";
import type { ResizablePanelMeta } from "./resizable.types";

function makeMeta(
  options: {
    id?: string;
    minSize?: number;
    maxSize?: number;
    collapsible?: boolean;
    collapsedSize?: number;
    onResize?: (size: number) => void;
    onCollapse?: () => void;
    onExpand?: () => void;
  } = {},
): ResizablePanelMeta {
  return {
    id: options.id ?? "panel",
    element: document.createElement("div"),
    minSize: () => options.minSize ?? 0,
    maxSize: () => options.maxSize ?? 100,
    collapsible: () => options.collapsible ?? false,
    collapsedSize: () => options.collapsedSize ?? 0,
    defaultSize: undefined,
    onResize: options.onResize,
    onCollapse: options.onCollapse,
    onExpand: options.onExpand,
  };
}

describe("effectiveMin", () => {
  it("可折叠时取 collapsedSize（继续拖会吸附到折叠）", () => {
    const meta = makeMeta({ minSize: 20, collapsible: true, collapsedSize: 0 });

    expect(effectiveMin(meta)).toBe(0);
  });

  it("不可折叠时取 minSize", () => {
    const meta = makeMeta({
      minSize: 20,
      collapsible: false,
      collapsedSize: 5,
    });

    expect(effectiveMin(meta)).toBe(20);
  });

  it("可折叠且 collapsedSize 大于 minSize 时仍以 collapsedSize 为准", () => {
    const meta = makeMeta({
      minSize: 10,
      collapsible: true,
      collapsedSize: 15,
    });

    expect(effectiveMin(meta)).toBe(15);
  });
});

describe("isCollapsedSize", () => {
  it("不可折叠时永远不是折叠态", () => {
    const meta = makeMeta({ collapsible: false, collapsedSize: 10 });

    expect(isCollapsedSize(meta, 0)).toBe(false);
    expect(isCollapsedSize(meta, 10)).toBe(false);
  });

  it("可折叠时小于等于 collapsedSize 视为折叠", () => {
    const meta = makeMeta({ collapsible: true, collapsedSize: 10 });

    expect(isCollapsedSize(meta, 0)).toBe(true);
    expect(isCollapsedSize(meta, 10)).toBe(true);
  });

  it("超出折叠尺寸即视为展开", () => {
    const meta = makeMeta({ collapsible: true, collapsedSize: 10 });

    expect(isCollapsedSize(meta, 10.002)).toBe(false);
  });

  it("容差内的浮点误差仍算折叠（EPSILON = 0.001）", () => {
    const meta = makeMeta({ collapsible: true, collapsedSize: 10 });

    expect(isCollapsedSize(meta, 10.001)).toBe(true);
  });
});

describe("constraintBounds", () => {
  it("按传入顺序映射 min/max，可折叠项用 collapsedSize 作为 min", () => {
    const bounds = constraintBounds([
      makeMeta({ id: "a", minSize: 5, maxSize: 60 }),
      makeMeta({
        id: "b",
        minSize: 10,
        maxSize: 80,
        collapsible: true,
        collapsedSize: 2,
      }),
    ]);

    expect(bounds).toEqual([
      { min: 5, max: 60 },
      { min: 2, max: 80 },
    ]);
  });

  it("空列表返回空边界", () => {
    expect(constraintBounds([])).toEqual([]);
  });
});

describe("pairConstraintsOf", () => {
  it("分别收集前后 panel 的 min/max/折叠参数", () => {
    const prev = makeMeta({ id: "prev", minSize: 5, maxSize: 60 });
    const next = makeMeta({
      id: "next",
      minSize: 12,
      maxSize: 70,
      collapsible: true,
      collapsedSize: 3,
    });

    expect(pairConstraintsOf(prev, next)).toEqual({
      prevMin: 5,
      prevMax: 60,
      prevCollapsible: false,
      prevCollapsedSize: 0,
      prevFloor: 5,
      nextMin: 3,
      nextMax: 70,
      nextCollapsible: true,
      nextCollapsedSize: 3,
      nextFloor: 12,
    });
  });

  it("读取的是实时 accessor（拖拽中途改变约束立即生效）", () => {
    let min = 5;
    const meta = makeMeta();
    const reactive: ResizablePanelMeta = {
      ...meta,
      minSize: () => min,
    };

    expect(pairConstraintsOf(reactive, reactive).prevMin).toBe(5);

    min = 25;
    expect(pairConstraintsOf(reactive, reactive).prevMin).toBe(25);
  });

  it("不触发回调（纯读取）", () => {
    const onResize = vi.fn();
    const onCollapse = vi.fn();
    const onExpand = vi.fn();
    const meta = makeMeta({
      collapsible: true,
      collapsedSize: 4,
      onResize,
      onCollapse,
      onExpand,
    });

    pairConstraintsOf(meta, meta);

    expect(onResize).not.toHaveBeenCalled();
    expect(onCollapse).not.toHaveBeenCalled();
    expect(onExpand).not.toHaveBeenCalled();
  });
});
