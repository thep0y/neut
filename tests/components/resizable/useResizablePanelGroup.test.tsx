import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResizablePanelMeta } from "~/components/resizable/resizable.types";
import { useResizablePanelGroup } from "~/components/resizable/useResizablePanelGroup";

/**
 * `useResizablePanelGroup` 是布局引擎：百分比权重、拖拽相邻两面板、
 * 折叠吸附、归一化、命令式 collapse/expand、持久化。
 *
 * 它通过 `registerPanel(meta)` 接收面板句柄，因此这里注入假 meta
 * ——不需要真实测量也能精确驱动约束算法。
 */

interface FakeMetaOptions {
  id: string;
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  collapsible?: boolean;
  collapsedSize?: number;
  onResize?: (size: number) => void;
  onCollapse?: () => void;
  onExpand?: () => void;
}

interface FakeMeta extends ResizablePanelMeta {
  element: HTMLElement & { previousElementSibling: unknown };
}

/**
 * 造一个假面板。为了测试 `adjacentOf` 的"相邻兄弟"解析，
 * 这里把面板元素按注册顺序挂到同一个父节点下。
 */
function makeMeta(options: FakeMetaOptions, handleBefore?: HTMLElement) {
  const el = document.createElement("div");
  el.setAttribute("data-panel", options.id);
  // handle 用于把前后两个 panel 隔开（真实 DOM 里 handle 就是兄弟节点）
  if (handleBefore) el.appendChild(handleBefore);
  document.body.appendChild(el);

  return {
    id: options.id,
    element: el,
    defaultSize: options.defaultSize,
    minSize: () => options.minSize ?? 0,
    maxSize: () => options.maxSize ?? 100,
    collapsible: () => options.collapsible ?? false,
    collapsedSize: () => options.collapsedSize ?? 0,
    onResize: options.onResize,
    onCollapse: options.onCollapse,
    onExpand: options.onExpand,
  } as FakeMeta;
}

/** 内存版 Storage，避免污染真实 localStorage */
function memoryStorage(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((key: string) => map.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      map.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      map.delete(key);
    }),
    clear: vi.fn(() => map.clear()),
    key: vi.fn(() => null),
    get length() {
      return map.size;
    },
    _map: map,
  } as unknown as Storage & { _map: Map<string, string> };
}

function renderGroup(
  overrides: {
    orientation?: "horizontal" | "vertical";
    defaultLayout?: Record<string, number>;
    autoSaveId?: string;
    storage?: Storage;
    keyboardResizeBy?: number;
  } = {},
  metas: FakeMetaOptions[] = [],
) {
  const [orientation] = createSignal(overrides.orientation ?? "horizontal");
  const [defaultLayout] = createSignal(overrides.defaultLayout);
  const [autoSaveId] = createSignal(overrides.autoSaveId);
  const [storage] = createSignal(overrides.storage);
  const [keyboardResizeBy] = createSignal(overrides.keyboardResizeBy ?? 10);
  const onLayoutChange = vi.fn();

  const hook = renderHook(() =>
    useResizablePanelGroup({
      orientation,
      defaultLayout,
      onLayoutChange,
      autoSaveId,
      storage,
      keyboardResizeBy,
    }),
  );

  const fakeMetas = metas.map((options) => makeMeta(options));
  const unregister = fakeMetas.map((meta) => hook.result.registerPanel(meta));

  return { ...hook, fakeMetas, unregister, onLayoutChange };
}

/** 让排队中的 initialize 执行完 */
async function flushInit() {
  await Promise.resolve();
  await Promise.resolve();
}

/**
 * 读当前布局。
 *
 * 引擎没有公开 `layout()`（那是内部的、带 roundPercent 的版本），
 * 对外暴露的是 `sizes()`（store 代理）与 `getPanelSize(id)`。
 * 这里用 `sizes()` 快照成普通对象，并对数值做两位小数舍入以便断言。
 */
function readLayout(result: {
  sizes: () => Record<string, number>;
}): Record<string, number> {
  const snapshot = result.sizes();
  return Object.fromEntries(
    Object.entries(snapshot).map(([id, value]) => [
      id,
      Math.round(value * 100) / 100,
    ]),
  );
}

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useResizablePanelGroup - 初始化与布局", () => {
  it("按 defaultSize 归一化到 100", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 30 },
      { id: "b", defaultSize: 70 },
    ]);
    await flushInit();

    expect(readLayout(result)).toEqual({ a: 30, b: 70 });

    cleanup();
  });

  it("权重总和不为 100 时归一化", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 1 },
      { id: "b", defaultSize: 3 },
    ]);
    await flushInit();

    expect(readLayout(result)).toEqual({ a: 25, b: 75 });

    cleanup();
  });

  it("缺少 defaultSize 的面板平分剩余空间", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 40 },
      { id: "b" },
      { id: "c" },
    ]);
    await flushInit();

    // 40 已定义，剩余 60 由 b、c 平分 => 各 30
    expect(readLayout(result)).toEqual({ a: 40, b: 30, c: 30 });

    cleanup();
  });

  it("全部缺少 defaultSize 时均分", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "a" },
      { id: "b" },
      { id: "c" },
      { id: "d" },
    ]);
    await flushInit();

    expect(readLayout(result)).toEqual({ a: 25, b: 25, c: 25, d: 25 });

    cleanup();
  });

  it("defaultLayout 优先于 defaultSize", async () => {
    const { result, cleanup } = renderGroup(
      { defaultLayout: { a: 80, b: 20 } },
      [
        { id: "a", defaultSize: 50 },
        { id: "b", defaultSize: 50 },
      ],
    );
    await flushInit();

    expect(readLayout(result)).toEqual({ a: 80, b: 20 });

    cleanup();
  });

  it("defaultLayout 只覆盖部分面板，其余用 defaultSize", async () => {
    const { result, cleanup } = renderGroup({ defaultLayout: { a: 70 } }, [
      { id: "a", defaultSize: 50 },
      { id: "b", defaultSize: 50 },
    ]);
    await flushInit();

    // a=70 来自 defaultLayout，b=50 来自 defaultSize => 归一化 70:50
    expect(readLayout(result).a).toBeCloseTo(58.33, 1);
    expect(readLayout(result).b).toBeCloseTo(41.67, 1);

    cleanup();
  });

  it("初始化只通知一次 onLayoutChange", async () => {
    const { cleanup, onLayoutChange } = renderGroup({}, [
      { id: "a", defaultSize: 50 },
      { id: "b", defaultSize: 50 },
    ]);
    await flushInit();

    expect(onLayoutChange).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it("没有面板时不初始化", async () => {
    const { result, cleanup, onLayoutChange } = renderGroup({});
    await flushInit();

    expect(readLayout(result)).toEqual({});
    expect(onLayoutChange).not.toHaveBeenCalled();

    cleanup();
  });

  it("注册顺序（DOM 顺序）决定 layout 的键顺序", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "x", defaultSize: 20 },
      { id: "y", defaultSize: 30 },
      { id: "z", defaultSize: 50 },
    ]);
    await flushInit();

    expect(Object.keys(readLayout(result))).toEqual(["x", "y", "z"]);

    cleanup();
  });

  it("初始化会应用 max 约束", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 90, maxSize: 60 },
      { id: "b", defaultSize: 10 },
    ]);
    await flushInit();

    // a 被 max=60 限制，b 得到剩下的 40
    expect(readLayout(result)).toEqual({ a: 60, b: 40 });

    cleanup();
  });
});

describe("useResizablePanelGroup - 面板注册与注销", () => {
  it("注销面板后其尺寸被移除", async () => {
    const { result, cleanup, unregister } = renderGroup({}, [
      { id: "a", defaultSize: 50 },
      { id: "b", defaultSize: 50 },
    ]);
    await flushInit();

    unregister[1]();

    expect(readLayout(result)).toEqual({ a: 50 });

    cleanup();
  });

  it("初始化后动态新增面板会等比压回 100", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 50 },
      { id: "b", defaultSize: 50 },
    ]);
    await flushInit();

    const extra = makeMeta({ id: "c", defaultSize: 50 });
    result.registerPanel(extra);

    const sum = Object.values(readLayout(result)).reduce((a, v) => a + v, 0);
    expect(sum).toBeCloseTo(100, 1);

    cleanup();
  });

  it("getPanelSize 反映当前尺寸", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 30 },
      { id: "b", defaultSize: 70 },
    ]);
    await flushInit();

    expect(result.getPanelSize("a")).toBe(30);
    expect(result.getPanelSize("b")).toBe(70);

    cleanup();
  });

  it("getPanelSize 对未知 id 返回 0", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 100 },
    ]);
    await flushInit();

    expect(result.getPanelSize("unknown")).toBe(0);

    cleanup();
  });
});

describe("useResizablePanelGroup - 拖拽与相邻解析", () => {
  /**
   * 真实 DOM 结构：panelA | handle | panelB，
   * `adjacentOf` 通过 handle 的前后兄弟节点找到两个面板。
   */
  function setupAdjacent(
    options: {
      a?: Partial<FakeMetaOptions>;
      b?: Partial<FakeMetaOptions>;
    } = {},
  ) {
    const group = renderGroup({}, []);

    const panelA = makeMeta({ id: "a", defaultSize: 50, ...options.a });
    const panelB = makeMeta({ id: "b", defaultSize: 50, ...options.b });
    const container = document.createElement("div");
    const handle = document.createElement("div");
    container.append(panelA.element, handle, panelB.element);
    document.body.appendChild(container);

    group.result.registerPanel(panelA);
    group.result.registerPanel(panelB);

    return { ...group, panelA, panelB, handle };
  }

  it("resolveAdjacent 通过 handle 找到前后两个面板", async () => {
    const { result, cleanup, panelA, panelB, handle } = setupAdjacent();
    await flushInit();

    const adjacent = result.resolveAdjacent(handle);

    expect(adjacent?.prev.id).toBe("a");
    expect(adjacent?.next.id).toBe("b");
    expect(adjacent?.total).toBe(100);

    void panelA;
    void panelB;
    cleanup();
  });

  it("handle 缺少相邻面板时返回 undefined", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 100 },
    ]);
    await flushInit();

    const container = document.createElement("div");
    const handle = document.createElement("div");
    container.appendChild(handle);
    document.body.appendChild(container);

    expect(result.resolveAdjacent(handle)).toBeUndefined();

    cleanup();
  });

  it("setAdjacentSize 按目标值移动分界线", async () => {
    const { result, cleanup, handle } = setupAdjacent();
    await flushInit();

    result.setAdjacentSize(handle, 70);

    expect(readLayout(result)).toEqual({ a: 70, b: 30 });

    cleanup();
  });

  it("setAdjacentSize 只通知不写 storage", async () => {
    const { result, cleanup, handle, onLayoutChange } = setupAdjacent();
    await flushInit();
    onLayoutChange.mockClear();

    result.setAdjacentSize(handle, 60);

    expect(onLayoutChange).toHaveBeenCalled();

    cleanup();
  });

  it("拖拽越界时受 min 约束", async () => {
    const { result, cleanup, handle } = setupAdjacent({
      a: { minSize: 20 },
    });
    await flushInit();

    result.setAdjacentSize(handle, 5);

    expect(readLayout(result).a).toBe(20);

    cleanup();
  });

  it("拖拽越界时受 max 约束", async () => {
    const { result, cleanup, handle } = setupAdjacent({
      a: { maxSize: 80 },
    });
    await flushInit();

    result.setAdjacentSize(handle, 95);

    expect(readLayout(result).a).toBe(80);

    cleanup();
  });

  it("相邻面板的 min 约束会反向限制前一面板", async () => {
    const { result, cleanup, handle } = setupAdjacent({
      b: { minSize: 30 },
    });
    await flushInit();

    result.setAdjacentSize(handle, 90);

    // b 至少 30 => a 最多 70
    expect(readLayout(result).a).toBe(70);

    cleanup();
  });

  it("nudgeAdjacent 按增量移动（键盘方向键）", async () => {
    const { result, cleanup, handle } = setupAdjacent();
    await flushInit();

    result.nudgeAdjacent(handle, 10);

    expect(readLayout(result)).toEqual({ a: 60, b: 40 });

    cleanup();
  });

  it("nudgeAdjacent 负增量向反方向移动", async () => {
    const { result, cleanup, handle } = setupAdjacent();
    await flushInit();

    result.nudgeAdjacent(handle, -10);

    expect(readLayout(result)).toEqual({ a: 40, b: 60 });

    cleanup();
  });

  it("beginDrag / endDrag 切换 dragging 状态", async () => {
    const { result, cleanup } = setupAdjacent();
    await flushInit();

    expect(result.dragging()).toBe(false);
    result.beginDrag();
    expect(result.dragging()).toBe(true);
    result.endDrag();
    expect(result.dragging()).toBe(false);

    cleanup();
  });

  it("handle 与面板之间隔着非面板节点时继续外扩", async () => {
    const group = renderGroup({}, []);
    const panelA = makeMeta({ id: "a", defaultSize: 50 });
    const panelB = makeMeta({ id: "b", defaultSize: 50 });
    const container = document.createElement("div");
    const spacerA = document.createElement("span");
    const handle = document.createElement("div");
    const spacerB = document.createElement("span");
    container.append(panelA.element, spacerA, handle, spacerB, panelB.element);
    document.body.appendChild(container);
    group.result.registerPanel(panelA);
    group.result.registerPanel(panelB);
    await flushInit();

    const adjacent = group.result.resolveAdjacent(handle);

    expect(adjacent?.prev.id).toBe("a");
    expect(adjacent?.next.id).toBe("b");

    group.cleanup();
  });
});

describe("useResizablePanelGroup - 折叠与展开", () => {
  it("collapsePanel 把面板收到 collapsedSize", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 50, collapsible: true, collapsedSize: 0 },
      { id: "b", defaultSize: 50 },
    ]);
    await flushInit();

    expect(result.collapsePanel("a")).toBe(true);
    expect(result.getPanelSize("a")).toBe(0);
    expect(result.getPanelSize("b")).toBe(100);

    cleanup();
  });

  it("不可折叠的面板 collapse 返回 false", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 50 },
      { id: "b", defaultSize: 50 },
    ]);
    await flushInit();

    expect(result.collapsePanel("a")).toBe(false);

    cleanup();
  });

  it("未知 id collapse 返回 false", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 100 },
    ]);
    await flushInit();

    expect(result.collapsePanel("missing")).toBe(false);

    cleanup();
  });

  it("已折叠时再次 collapse 返回 false", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 50, collapsible: true },
      { id: "b", defaultSize: 50 },
    ]);
    await flushInit();

    expect(result.collapsePanel("a")).toBe(true);
    expect(result.collapsePanel("a")).toBe(false);

    cleanup();
  });

  it("expandPanel 恢复到折叠前记录的尺寸", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 40, collapsible: true },
      { id: "b", defaultSize: 60 },
    ]);
    await flushInit();

    result.collapsePanel("a");
    expect(result.expandPanel("a")).toBe(true);

    // 恢复到 collapse 之前记录的 40
    expect(result.getPanelSize("a")).toBe(40);

    cleanup();
  });

  it("未折叠时 expand 返回 false", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 50, collapsible: true },
      { id: "b", defaultSize: 50 },
    ]);
    await flushInit();

    expect(result.expandPanel("a")).toBe(false);

    cleanup();
  });

  it("不可折叠的面板 expand 返回 false", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 50 },
      { id: "b", defaultSize: 50 },
    ]);
    await flushInit();

    expect(result.expandPanel("a")).toBe(false);

    cleanup();
  });

  it("isPanelCollapsed 反映折叠状态", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 50, collapsible: true },
      { id: "b", defaultSize: 50 },
    ]);
    await flushInit();

    expect(result.isPanelCollapsed("a")).toBe(false);
    result.collapsePanel("a");
    expect(result.isPanelCollapsed("a")).toBe(true);

    cleanup();
  });

  it("isPanelCollapsed 对未知 id 返回 false", async () => {
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 100 },
    ]);
    await flushInit();

    expect(result.isPanelCollapsed("missing")).toBe(false);

    cleanup();
  });

  it("折叠触发 onCollapse，展开触发 onExpand", async () => {
    const onCollapse = vi.fn();
    const onExpand = vi.fn();
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 50, collapsible: true, onCollapse, onExpand },
      { id: "b", defaultSize: 50 },
    ]);
    await flushInit();

    result.collapsePanel("a");
    expect(onCollapse).toHaveBeenCalledTimes(1);

    result.expandPanel("a");
    expect(onExpand).toHaveBeenCalledTimes(1);

    cleanup();
  });

  it("命令式设置也触发 onResize", async () => {
    const onResize = vi.fn();
    const { result, cleanup } = renderGroup({}, [
      { id: "a", defaultSize: 50, onResize },
      { id: "b", defaultSize: 50 },
    ]);
    await flushInit();
    onResize.mockClear();

    result.setPanelSize("a", 70);

    expect(onResize).toHaveBeenCalledWith(70);

    cleanup();
  });

  it("setPanelSize 对未知 id 是空操作", async () => {
    const { result, cleanup, onLayoutChange } = renderGroup({}, [
      { id: "a", defaultSize: 100 },
    ]);
    await flushInit();
    onLayoutChange.mockClear();

    result.setPanelSize("missing", 50);

    expect(onLayoutChange).not.toHaveBeenCalled();

    cleanup();
  });
});

describe("useResizablePanelGroup - 折叠吸附与 handle 切换", () => {
  /** 造 panelA | handle | panelB 结构并注册 */
  function buildAdjacent(
    group: ReturnType<typeof renderGroup>,
    options: { a?: Partial<FakeMetaOptions>; b?: Partial<FakeMetaOptions> },
  ) {
    const panelA = makeMeta({ id: "a", defaultSize: 50, ...options.a });
    const panelB = makeMeta({ id: "b", defaultSize: 50, ...options.b });
    const container = document.createElement("div");
    const handle = document.createElement("div");
    container.append(panelA.element, handle, panelB.element);
    document.body.appendChild(container);
    group.result.registerPanel(panelA);
    group.result.registerPanel(panelB);
    return { panelA, panelB, handle };
  }

  it("吸附：目标更接近 collapsedSize 时贴到 collapsedSize", async () => {
    const group = renderGroup({}, []);
    // collapsedSize=0、minSize=20，目标 5 更接近 0
    const { handle } = buildAdjacent(group, {
      a: { collapsible: true, collapsedSize: 0, minSize: 20 },
    });
    await flushInit();

    group.result.setAdjacentSize(handle, 5);

    expect(group.result.getPanelSize("a")).toBe(0);

    group.cleanup();
  });

  it("吸附：目标更接近 minSize 时贴到 minSize", async () => {
    const group = renderGroup({}, []);
    const { handle } = buildAdjacent(group, {
      a: { collapsible: true, collapsedSize: 0, minSize: 20 },
    });
    await flushInit();

    // 目标 18 更接近 minSize(20)
    group.result.setAdjacentSize(handle, 18);

    expect(group.result.getPanelSize("a")).toBe(20);

    group.cleanup();
  });

  it("吸附：目标在 minSize 之上时不受吸附影响", async () => {
    const group = renderGroup({}, []);
    const { handle } = buildAdjacent(group, {
      a: { collapsible: true, collapsedSize: 0, minSize: 20 },
    });
    await flushInit();

    group.result.setAdjacentSize(handle, 35);

    expect(group.result.getPanelSize("a")).toBe(35);

    group.cleanup();
  });

  it("toggleHandleCollapse 折叠可折叠的 prev 面板，再次切换则展开", async () => {
    const group = renderGroup({}, []);
    const { handle } = buildAdjacent(group, { a: { collapsible: true } });
    await flushInit();

    group.result.toggleHandleCollapse(handle);
    expect(group.result.isPanelCollapsed("a")).toBe(true);

    group.result.toggleHandleCollapse(handle);
    expect(group.result.isPanelCollapsed("a")).toBe(false);

    group.cleanup();
  });

  it("prev 不可折叠时 toggleHandleCollapse 作用于 next", async () => {
    const group = renderGroup({}, []);
    const { handle } = buildAdjacent(group, { b: { collapsible: true } });
    await flushInit();

    group.result.toggleHandleCollapse(handle);

    expect(group.result.isPanelCollapsed("b")).toBe(true);

    group.cleanup();
  });

  it("两侧都不可折叠时 toggleHandleCollapse 是空操作", async () => {
    const group = renderGroup({}, []);
    const { handle } = buildAdjacent(group, {});
    await flushInit();

    expect(() => group.result.toggleHandleCollapse(handle)).not.toThrow();
    expect(group.result.getPanelSize("a")).toBe(50);

    group.cleanup();
  });
});

describe("useResizablePanelGroup - 持久化", () => {
  it("autoSaveId + storage 时初始化后写入 storage", async () => {
    const storage = memoryStorage();
    const { cleanup } = renderGroup({ autoSaveId: "layout-1", storage }, [
      { id: "a", defaultSize: 50 },
      { id: "b", defaultSize: 50 },
    ]);
    await flushInit();

    expect(storage.setItem).toHaveBeenCalledWith(
      "neut-resizable:layout-1",
      JSON.stringify({ a: 50, b: 50 }),
    );

    cleanup();
  });

  it("没有 autoSaveId 时不写 storage", async () => {
    const storage = memoryStorage();
    const { cleanup } = renderGroup({ storage }, [
      { id: "a", defaultSize: 100 },
    ]);
    await flushInit();

    expect(storage.setItem).not.toHaveBeenCalled();

    cleanup();
  });

  it("初始化时优先读取已保存的布局", async () => {
    const storage = memoryStorage({
      "neut-resizable:layout-1": JSON.stringify({ a: 80, b: 20 }),
    });
    const { result, cleanup } = renderGroup(
      { autoSaveId: "layout-1", storage },
      [
        { id: "a", defaultSize: 50 },
        { id: "b", defaultSize: 50 },
      ],
    );
    await flushInit();

    expect(readLayout(result)).toEqual({ a: 80, b: 20 });

    cleanup();
  });

  it("保存的布局优先于 defaultLayout", async () => {
    const storage = memoryStorage({
      "neut-resizable:layout-1": JSON.stringify({ a: 10, b: 90 }),
    });
    const { result, cleanup } = renderGroup(
      { autoSaveId: "layout-1", storage, defaultLayout: { a: 60, b: 40 } },
      [
        { id: "a", defaultSize: 50 },
        { id: "b", defaultSize: 50 },
      ],
    );
    await flushInit();

    expect(readLayout(result)).toEqual({ a: 10, b: 90 });

    cleanup();
  });

  it("storage 内容非法 JSON 时回退到默认布局", async () => {
    const storage = memoryStorage({
      "neut-resizable:layout-1": "{ not json",
    });
    const { result, cleanup } = renderGroup(
      { autoSaveId: "layout-1", storage },
      [
        { id: "a", defaultSize: 50 },
        { id: "b", defaultSize: 50 },
      ],
    );
    await flushInit();

    expect(readLayout(result)).toEqual({ a: 50, b: 50 });

    cleanup();
  });

  it("storage 存的是非对象时回退到默认布局", async () => {
    const storage = memoryStorage({
      "neut-resizable:layout-1": JSON.stringify("just a string"),
    });
    const { result, cleanup } = renderGroup(
      { autoSaveId: "layout-1", storage },
      [
        { id: "a", defaultSize: 50 },
        { id: "b", defaultSize: 50 },
      ],
    );
    await flushInit();

    expect(readLayout(result)).toEqual({ a: 50, b: 50 });

    cleanup();
  });

  it("setItem 抛错时被吞掉（隐私模式）", async () => {
    const storage = memoryStorage();
    (storage.setItem as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    const { cleanup } = renderGroup({ autoSaveId: "layout-1", storage }, [
      { id: "a", defaultSize: 100 },
    ]);

    await expect(flushInit()).resolves.toBeUndefined();

    cleanup();
  });

  it("commitLayout 会持久化当前布局", async () => {
    const storage = memoryStorage();
    const { result, cleanup } = renderGroup(
      { autoSaveId: "layout-1", storage },
      [
        { id: "a", defaultSize: 50 },
        { id: "b", defaultSize: 50 },
      ],
    );
    await flushInit();
    (storage.setItem as ReturnType<typeof vi.fn>).mockClear();

    result.setPanelSize("a", 70);
    result.commitLayout();

    expect(storage.setItem).toHaveBeenCalled();

    cleanup();
  });
});

describe("useResizablePanelGroup - groupSizePx / isRtl / accessors", () => {
  it("没有 groupElement 时 groupSizePx 为 0", () => {
    const { result, cleanup } = renderGroup();

    expect(result.groupSizePx()).toBe(0);

    cleanup();
  });

  it("horizontal 时用 clientWidth", () => {
    const { result, cleanup } = renderGroup({ orientation: "horizontal" });
    const el = document.createElement("div");
    Object.defineProperty(el, "clientWidth", { value: 800 });
    Object.defineProperty(el, "clientHeight", { value: 600 });
    result.setGroupElement(el);

    expect(result.groupSizePx()).toBe(800);

    cleanup();
  });

  it("vertical 时用 clientHeight", () => {
    const { result, cleanup } = renderGroup({ orientation: "vertical" });
    const el = document.createElement("div");
    Object.defineProperty(el, "clientWidth", { value: 800 });
    Object.defineProperty(el, "clientHeight", { value: 600 });
    result.setGroupElement(el);

    expect(result.groupSizePx()).toBe(600);

    cleanup();
  });

  it("没有 groupElement 时 isRtl 为 false", () => {
    const { result, cleanup } = renderGroup();

    expect(result.isRtl()).toBe(false);

    cleanup();
  });

  it("groupElement 的计算方向为 rtl 时 isRtl 为 true", () => {
    const { result, cleanup } = renderGroup();
    const el = document.createElement("div");
    document.body.appendChild(el);
    const original = window.getComputedStyle;
    window.getComputedStyle = (() =>
      ({ direction: "rtl" }) as CSSStyleDeclaration) as never;

    try {
      result.setGroupElement(el);
      expect(result.isRtl()).toBe(true);
    } finally {
      window.getComputedStyle = original;
    }

    cleanup();
  });

  it("groupElement 的计算方向为 ltr 时 isRtl 为 false", () => {
    const { result, cleanup } = renderGroup();
    const el = document.createElement("div");
    document.body.appendChild(el);
    const original = window.getComputedStyle;
    window.getComputedStyle = (() =>
      ({ direction: "ltr" }) as CSSStyleDeclaration) as never;

    try {
      result.setGroupElement(el);
      expect(result.isRtl()).toBe(false);
    } finally {
      window.getComputedStyle = original;
    }

    cleanup();
  });

  it("groupElement accessor 反映 setGroupElement", () => {
    const { result, cleanup } = renderGroup();
    const el = document.createElement("div");

    result.setGroupElement(el);
    expect(result.groupElement()).toBe(el);

    result.setGroupElement(undefined);
    expect(result.groupElement()).toBeUndefined();

    cleanup();
  });

  it("keyboardResizeBy 透传", () => {
    const { result, cleanup } = renderGroup({ keyboardResizeBy: 15 });

    expect(result.keyboardResizeBy()).toBe(15);

    cleanup();
  });

  it("orientation accessor 反映传入值", () => {
    const { result, cleanup } = renderGroup({ orientation: "vertical" });

    expect(result.orientation()).toBe("vertical");

    cleanup();
  });
});
