import { renderHook } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import type { PanelRegistry } from "~/components/resizable/resizable.registry";
import { createPanelSizes } from "~/components/resizable/resizable.sizes";
import type { ResizablePanelMeta } from "~/components/resizable/resizable.types";

function meta(id: string, overrides: Partial<ResizablePanelMeta> = {}) {
  return {
    id,
    element: document.createElement("div"),
    minSize: () => 0,
    maxSize: () => 100,
    collapsible: () => false,
    collapsedSize: () => 0,
    defaultSize: undefined,
    ...overrides,
  } satisfies ResizablePanelMeta;
}

function setup(
  options: {
    metas?: ResizablePanelMeta[];
    neighbors?: {
      prev: ResizablePanelMeta | undefined;
      next: ResizablePanelMeta | undefined;
    };
    initial?: Record<string, number>;
  } = {},
) {
  const metas = options.metas ?? [meta("a"), meta("b")];
  const reportSizeChange = vi.fn();
  const registry = {
    neighbors: () => options.neighbors ?? { prev: undefined, next: undefined },
  } as unknown as PanelRegistry;

  const hook = renderHook(() => {
    const sizes = createPanelSizes({
      metas: () => metas,
      registry,
      reportSizeChange,
    });
    if (options.initial) sizes.applyAll(Object.values(options.initial), false);
    return sizes;
  });

  return { ...hook, reportSizeChange, metas };
}

describe("createPanelSizes 初始与读取", () => {
  it("初始所有面板尺寸为 0", () => {
    const { result } = setup();

    expect(result.sizeOf("a")).toBe(0);
    expect(result.store).toEqual({});
  });
});

describe("createPanelSizes applyAll", () => {
  it("按面板顺序批量写入", () => {
    const { result } = setup();

    result.applyAll([30, 70]);

    expect(result.store).toEqual({ a: 30, b: 70 });
  });

  it("默认上报每个变化的面板", () => {
    const { result, reportSizeChange } = setup();

    result.applyAll([30, 70]);

    expect(reportSizeChange).toHaveBeenCalledTimes(2);
    expect(reportSizeChange).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: "a" }),
      0,
      30,
    );
    expect(reportSizeChange).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: "b" }),
      0,
      70,
    );
  });

  it("report 为 false 时只写入不上报（初始化）", () => {
    const { result, reportSizeChange } = setup();

    result.applyAll([30, 70], false);

    expect(result.store).toEqual({ a: 30, b: 70 });
    expect(reportSizeChange).not.toHaveBeenCalled();
  });

  it("值比面板少时只写前面的面板", () => {
    const { result, reportSizeChange } = setup();

    result.applyAll([30]);

    expect(result.store).toEqual({ a: 30 });
    expect(reportSizeChange).toHaveBeenCalledTimes(1);
  });

  it("undefined 位置不会覆盖已有尺寸", () => {
    const { result } = setup();
    result.applyAll([30, 70], false);

    result.applyAll([undefined as unknown as number, 60], false);

    expect(result.store).toEqual({ a: 30, b: 60 });
  });

  it("再次 applyAll 时上报的旧值来自上一次写入", () => {
    const { result, reportSizeChange } = setup();
    result.applyAll([30, 70], false);
    reportSizeChange.mockClear();

    result.applyAll([40, 60]);

    expect(reportSizeChange).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: "a" }),
      30,
      40,
    );
  });
});

describe("createPanelSizes applyPair", () => {
  it("按总量切分并把两侧之和保持不变", () => {
    const { result } = setup();

    result.applyPair(meta("a"), meta("b"), 30, 100);

    expect(result.store.a).toBe(30);
    expect(result.store.b).toBe(70);
  });

  it("上报两侧的变化", () => {
    const { result, reportSizeChange } = setup();

    result.applyPair(meta("a"), meta("b"), 30, 100);

    expect(reportSizeChange).toHaveBeenCalledTimes(2);
    expect(reportSizeChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: "b" }),
      0,
      70,
    );
  });

  it("目标值被 min/max 约束夹取后，另一侧相应补偿", () => {
    const { result } = setup();
    const prev = meta("a", { minSize: () => 40 });
    const next = meta("b");

    result.applyPair(prev, next, 10, 100);

    expect(result.store.a).toBe(40);
    expect(result.store.b).toBe(60);
  });
});

describe("createPanelSizes applyPanelTarget", () => {
  it("有后邻面板时与它重分配", () => {
    const a = meta("a");
    const b = meta("b");
    const { result } = setup({ neighbors: { prev: undefined, next: b } });
    result.applyAll([30, 70], false);

    result.applyPanelTarget(a, 50);

    expect(result.store.a + result.store.b).toBe(100);
    expect(result.store.a).toBe(50);
  });

  it("只有前邻面板时与它重分配（目标值从总量里扣）", () => {
    const a = meta("a");
    const b = meta("b");
    const { result } = setup({ neighbors: { prev: a, next: undefined } });
    result.applyAll([30, 70], false);

    result.applyPanelTarget(b, 40);

    expect(result.store.a + result.store.b).toBe(100);
    expect(result.store.b).toBe(40);
    expect(result.store.a).toBe(60);
  });

  it("独苗面板直接占满 100（没有可重分配的对象）", () => {
    const only = meta("solo");
    const { result } = setup({
      metas: [only],
      neighbors: { prev: undefined, next: undefined },
    });

    result.applyPanelTarget(only, 42);

    expect(result.store.solo).toBe(100);
  });
});

describe("createPanelSizes remove", () => {
  it("删除指定面板的尺寸", () => {
    const { result } = setup();
    result.applyAll([30, 70], false);

    result.remove("a");

    expect(result.store).toEqual({ b: 70 });
    expect(result.sizeOf("a")).toBe(0);
  });

  it("删除不存在的面板是安全的", () => {
    const { result } = setup();

    expect(() => result.remove("missing")).not.toThrow();
    expect(result.store).toEqual({});
  });
});
