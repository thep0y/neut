import { describe, expect, it, vi } from "vitest";
import type { PanelRegistry } from "~/components/resizable/resizable.registry";
import { createPanelLifecycle } from "~/components/resizable/resizable.lifecycle";
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

/**
 * 用真实 registry 语义的最小替身：只维护注册顺序，够 lifecycle 用了。
 * （registry 自身的行为有 resizable.registry.test.ts 覆盖。）
 */
function fakeRegistry() {
  const list: ResizablePanelMeta[] = [];
  return {
    list,
    add: (item: ResizablePanelMeta) => void list.push(item),
    remove: (item: ResizablePanelMeta) => {
      const index = list.indexOf(item);
      if (index >= 0) list.splice(index, 1);
    },
    ordered: () => [...list],
  } as unknown as PanelRegistry & { list: ResizablePanelMeta[] };
}

function setup(
  options: {
    metas?: ResizablePanelMeta[];
    saved?: Record<string, number>;
    defaultLayout?: Record<string, number>;
    withWindow?: boolean;
  } = {},
) {
  const metas = options.metas ?? [];
  const registry = fakeRegistry();
  const commit = vi.fn();
  const onRegistryChange = vi.fn();
  const sizes = createPanelSizes({
    metas: () => metas,
    registry,
    reportSizeChange: vi.fn(),
  });

  const lifecycle = createPanelLifecycle({
    metas: () => metas,
    registry,
    sizes,
    readSaved: () => options.saved,
    defaultLayout: () => options.defaultLayout,
    commit,
    onRegistryChange,
  });

  return { lifecycle, sizes, registry, commit, onRegistryChange, metas };
}

describe("createPanelLifecycle initialize", () => {
  it("按面板数均分初始尺寸并归一化到 100", () => {
    const { lifecycle, sizes, metas } = setup();
    metas.push(meta("a"), meta("b"));

    lifecycle.initialize();

    expect(sizes.store.a + sizes.store.b).toBeCloseTo(100);
    expect(lifecycle.isInitialized()).toBe(true);
  });

  it("优先使用已保存的布局", () => {
    const { lifecycle, sizes, metas } = setup({
      saved: { a: 20, b: 80 },
    });
    metas.push(meta("a"), meta("b"));

    lifecycle.initialize();

    expect(sizes.store).toMatchObject({ a: 20, b: 80 });
  });

  it("没有保存值时用 defaultLayout", () => {
    const { lifecycle, sizes, metas } = setup({
      defaultLayout: { a: 70, b: 30 },
    });
    metas.push(meta("a"), meta("b"));

    lifecycle.initialize();

    expect(sizes.store).toMatchObject({ a: 70, b: 30 });
  });

  it("初始化时提交（通知 + 持久化）", () => {
    const { lifecycle, commit, metas } = setup();
    metas.push(meta("a"));

    lifecycle.initialize();

    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("重复初始化只生效一次", () => {
    const { lifecycle, commit, metas } = setup();
    metas.push(meta("a"));

    lifecycle.initialize();
    lifecycle.initialize();

    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("没有面板时不初始化（等面板挂载）", () => {
    const { lifecycle, commit } = setup();

    lifecycle.initialize();

    expect(lifecycle.isInitialized()).toBe(false);
    expect(commit).not.toHaveBeenCalled();
  });

  it("SSR（没有 window）时不初始化", () => {
    vi.stubGlobal("window", undefined);
    try {
      const { lifecycle, commit, metas } = setup();
      metas.push(meta("a"));

      lifecycle.initialize();

      expect(lifecycle.isInitialized()).toBe(false);
      expect(commit).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("每次初始化都会重新读取 bounds（min/max 约束参与归一化）", () => {
    const { lifecycle, sizes, metas } = setup();
    metas.push(
      meta("a", { minSize: () => 60 }),
      meta("b", { minSize: () => 0, maxSize: () => 100 }),
    );

    lifecycle.initialize();

    expect(sizes.store.a).toBeGreaterThanOrEqual(60);
  });
});

describe("createPanelLifecycle registerPanel", () => {
  it("注册后加入注册表并通知变化", () => {
    const { lifecycle, registry, onRegistryChange } = setup();
    const a = meta("a");

    lifecycle.registerPanel(a);

    expect(registry.list).toEqual([a]);
    expect(onRegistryChange).toHaveBeenCalledTimes(1);
  });

  it("首个面板挂载时把初始化排到微任务（等其余面板注册完）", async () => {
    const { lifecycle, sizes, metas, commit } = setup();
    metas.push(meta("a"), meta("b"));

    // 只注册第一个：此刻不能立刻初始化
    lifecycle.registerPanel(metas[0]!);
    expect(lifecycle.isInitialized()).toBe(false);

    await Promise.resolve();
    expect(lifecycle.isInitialized()).toBe(true);
    expect(commit).toHaveBeenCalled();
    expect(sizes.store.b).toBeDefined();
  });

  it("初始化之后注册的新面板按默认尺寸参与等比归一化", () => {
    const { lifecycle, sizes, metas } = setup();
    metas.push(meta("a"));
    lifecycle.initialize();
    sizes.applyAll([100], false);

    const b = meta("b", { defaultSize: 40 });
    metas.push(b);
    lifecycle.registerPanel(b);

    // 权重 (100, 40) 归一到 100：新面板约占 2/7
    expect(sizes.store.a + sizes.store.b).toBeCloseTo(100);
    expect(sizes.store.b).toBeCloseTo((40 / 140) * 100);
  });

  it("新面板没有 defaultSize 时按 100/面板数 作为权重", () => {
    const { lifecycle, sizes, metas } = setup();
    metas.push(meta("a"));
    lifecycle.initialize();
    sizes.applyAll([100], false);

    const b = meta("b");
    metas.push(b);
    lifecycle.registerPanel(b);

    // 权重 (100, 50) 归一到 100：新面板占 1/3
    expect(sizes.store.b).toBeCloseTo(100 / 3);
  });

  it("已有尺寸的面板再次注册不会重置它（重注册场景）", () => {
    const { lifecycle, sizes, metas } = setup();
    const a = meta("a");
    metas.push(a);
    lifecycle.initialize();
    sizes.applyAll([100], false);

    lifecycle.registerPanel(a);

    expect(sizes.store.a).toBe(100);
  });

  it("微任务执行前已手动初始化过，则不重复初始化", async () => {
    const { lifecycle, commit, metas } = setup();
    metas.push(meta("a"));

    lifecycle.registerPanel(metas[0]!); // 排了一个微任务
    lifecycle.initialize(); // 抢先初始化
    await Promise.resolve(); // 微任务到点：守卫拦下第二次

    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("SSR（没有 window）时注册面板不会排初始化", async () => {
    vi.stubGlobal("window", undefined);
    try {
      const { lifecycle, metas } = setup();
      metas.push(meta("a"));

      lifecycle.registerPanel(metas[0]!);
      await Promise.resolve();

      expect(lifecycle.isInitialized()).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("注销时移出注册表、通知变化并删除尺寸", () => {
    const { lifecycle, sizes, registry, onRegistryChange, metas } = setup();
    const a = meta("a");
    metas.push(a);
    lifecycle.initialize();
    const unregister = lifecycle.registerPanel(a);

    unregister();

    expect(registry.list).toEqual([]);
    expect(sizes.store.a).toBeUndefined();
    expect(onRegistryChange).toHaveBeenCalledTimes(2); // 注册一次、注销一次
  });
});
