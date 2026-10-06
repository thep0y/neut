import { describe, expect, it, vi } from "vitest";
import { createLayoutReporting } from "~/components/resizable/resizable.reporting";
import type { ResizablePanelMeta } from "~/components/resizable/resizable.types";

function meta(
  id: string,
  overrides: Partial<ResizablePanelMeta> = {},
): ResizablePanelMeta {
  return {
    id,
    element: document.createElement("div"),
    minSize: () => 0,
    maxSize: () => 100,
    collapsible: () => false,
    collapsedSize: () => 0,
    defaultSize: undefined,
    ...overrides,
  };
}

function setup(
  options: {
    sizes?: Record<string, number>;
    autoSaveId?: string;
    storage?: Storage;
  } = {},
) {
  const sizes = options.sizes ?? { a: 30, b: 70 };
  const metas = [meta("a"), meta("b")];
  const onLayoutChange = vi.fn();
  const ctx = {
    metas: () => metas,
    sizeOf: (id: string) => sizes[id] ?? 0,
    onLayoutChange,
    persist: () => ({
      autoSaveId: options.autoSaveId,
      storage: options.storage,
    }),
  };
  const reporting = createLayoutReporting(ctx);

  return { reporting, onLayoutChange, metas, sizes, ctx };
}

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    clear: () => data.clear(),
    key: () => null,
    length: 0,
    data,
  } as unknown as Storage & { data: Map<string, string> };
}

describe("createLayoutReporting snapshot", () => {
  it("按面板顺序整理出布局，并把尺寸四舍五入", () => {
    const { reporting } = setup({ sizes: { a: 33.333333, b: 66.666667 } });

    expect(reporting.snapshot()).toEqual({ a: 33.33, b: 66.67 });
  });

  it("尺寸缺失时按 0 处理", () => {
    const { reporting } = setup({ sizes: {} });

    expect(reporting.snapshot()).toEqual({ a: 0, b: 0 });
  });

  it("没有面板时得到空布局", () => {
    const { reporting, ctx } = setup();
    ctx.metas = () => [];

    expect(reporting.snapshot()).toEqual({});
  });
});

describe("createLayoutReporting notify / commit", () => {
  it("notify 只回调当前布局", () => {
    const { reporting, onLayoutChange } = setup();

    reporting.notify();

    expect(onLayoutChange).toHaveBeenCalledWith({ a: 30, b: 70 });
  });

  it("notify 不写 storage", () => {
    const storage = fakeStorage();
    const { reporting } = setup({ autoSaveId: "g1", storage });

    reporting.notify();

    expect(storage.data.size).toBe(0);
  });

  it("commit 同时回调并持久化", () => {
    const storage = fakeStorage();
    const { reporting, onLayoutChange } = setup({
      autoSaveId: "g1",
      storage,
    });

    reporting.commit();

    expect(onLayoutChange).toHaveBeenCalledWith({ a: 30, b: 70 });
    expect(storage.getItem("neut-resizable:g1")).toBe(
      JSON.stringify({ a: 30, b: 70 }),
    );
  });

  it("没有 autoSaveId 时 commit 只回调", () => {
    const storage = fakeStorage();
    const { reporting, onLayoutChange } = setup({ storage });

    reporting.commit();

    expect(onLayoutChange).toHaveBeenCalledTimes(1);
    expect(storage.data.size).toBe(0);
  });
});

describe("createLayoutReporting readSaved", () => {
  it("读回已保存的布局", () => {
    const storage = fakeStorage({
      "neut-resizable:g1": JSON.stringify({ a: 40, b: 60 }),
    });
    const { reporting } = setup({ autoSaveId: "g1", storage });

    expect(reporting.readSaved()).toEqual({ a: 40, b: 60 });
  });

  it("没有保存过时返回 undefined", () => {
    const { reporting } = setup({ autoSaveId: "g1", storage: fakeStorage() });

    expect(reporting.readSaved()).toBeUndefined();
  });

  it("storage 抛错时静默返回 undefined", () => {
    const storage = {
      getItem: () => {
        throw new Error("隐私模式");
      },
    } as unknown as Storage;
    const { reporting } = setup({ autoSaveId: "g1", storage });

    expect(() => reporting.readSaved()).not.toThrow();
    expect(reporting.readSaved()).toBeUndefined();
  });
});

describe("createLayoutReporting reportSizeChange", () => {
  it("始终上报新尺寸（四舍五入）", () => {
    const onResize = vi.fn();
    const { reporting } = setup();
    const target = meta("a", { onResize });

    reporting.reportSizeChange(target, 30, 33.333333);

    expect(onResize).toHaveBeenCalledWith(33.33);
  });

  it("不可折叠面板不触发 onCollapse / onExpand", () => {
    const onCollapse = vi.fn();
    const onExpand = vi.fn();
    const { reporting } = setup();
    const target = meta("a", {
      collapsible: () => false,
      collapsedSize: () => 10,
      onCollapse,
      onExpand,
    });

    reporting.reportSizeChange(target, 50, 10);

    expect(onCollapse).not.toHaveBeenCalled();
    expect(onExpand).not.toHaveBeenCalled();
  });

  it("从展开跨到折叠时触发 onCollapse", () => {
    const onCollapse = vi.fn();
    const onExpand = vi.fn();
    const { reporting } = setup();
    const target = meta("a", {
      collapsible: () => true,
      collapsedSize: () => 10,
      onCollapse,
      onExpand,
    });

    reporting.reportSizeChange(target, 50, 10);

    expect(onCollapse).toHaveBeenCalledTimes(1);
    expect(onExpand).not.toHaveBeenCalled();
  });

  it("从折叠跨到展开时触发 onExpand", () => {
    const onCollapse = vi.fn();
    const onExpand = vi.fn();
    const { reporting } = setup();
    const target = meta("a", {
      collapsible: () => true,
      collapsedSize: () => 10,
      onCollapse,
      onExpand,
    });

    reporting.reportSizeChange(target, 10, 50);

    expect(onExpand).toHaveBeenCalledTimes(1);
    expect(onCollapse).not.toHaveBeenCalled();
  });

  it("折叠状态没变时不触发 onCollapse / onExpand", () => {
    const onCollapse = vi.fn();
    const onExpand = vi.fn();
    const { reporting } = setup();
    const target = meta("a", {
      collapsible: () => true,
      collapsedSize: () => 10,
      onCollapse,
      onExpand,
    });

    reporting.reportSizeChange(target, 40, 60); // 展开 → 展开
    reporting.reportSizeChange(target, 10, 10); // 折叠 → 折叠

    expect(onCollapse).not.toHaveBeenCalled();
    expect(onExpand).not.toHaveBeenCalled();
  });
});
