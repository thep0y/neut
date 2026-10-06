import { renderHook } from "@solidjs/testing-library";
import { runWithOwner } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import type { ResizablePanelGroupContextValue } from "~/components/resizable/resizable.context";
import {
  useResizablePanel,
  type ResizablePanelLocal,
} from "~/components/resizable/ResizablePanel/useResizablePanel";
import type { ResizablePanelMeta } from "~/components/resizable/resizable.types";

function fakeContext(
  overrides: Partial<ResizablePanelGroupContextValue> = {},
): ResizablePanelGroupContextValue & {
  registerPanel: ReturnType<typeof vi.fn>;
} {
  return {
    orientation: () => "horizontal",
    sizes: () => ({ a: 30 }),
    groupElement: () => undefined,
    setGroupElement: () => {},
    dragging: () => false,
    keyboardResizeBy: () => 10,
    registerPanel: vi.fn(() => vi.fn()),
    resolveAdjacent: () => undefined,
    setAdjacentSize: () => {},
    nudgeAdjacent: () => {},
    toggleHandleCollapse: () => {},
    groupSizePx: () => 0,
    isRtl: () => false,
    beginDrag: () => {},
    endDrag: () => {},
    commitLayout: () => {},
    setPanelSize: vi.fn(),
    collapsePanel: vi.fn(() => true),
    expandPanel: vi.fn(() => true),
    isPanelCollapsed: vi.fn(() => false),
    getPanelSize: vi.fn(() => 30),
    ...overrides,
  } as never;
}

function local(
  overrides: Partial<ResizablePanelLocal> = {},
): ResizablePanelLocal {
  return {
    minSize: 0,
    maxSize: 100,
    collapsible: false,
    collapsedSize: 0,
    ...overrides,
  };
}

function setup(
  ctxOptions: Partial<ResizablePanelGroupContextValue> = {},
  localOptions: Partial<ResizablePanelLocal> = {},
) {
  const ctx = fakeContext(ctxOptions);
  const panelRef = vi.fn();
  const hook = renderHook(() =>
    useResizablePanel({
      ctx,
      id: "a",
      local: local({ panelRef, ...localOptions }),
    }),
  );

  // 真实组件里 register 由 Solid 在挂载期调用（处于 owner 内）；
  // 测试里手动调用，必须 runWithOwner，onCleanup 才会随 cleanup() 触发
  const register = (element: HTMLElement) =>
    runWithOwner(hook.owner, () => hook.result.register(element));

  return { ctx, panelRef, register, ...hook };
}

/** 取注册进引擎的 meta（register 调用时的第一参） */
function registeredMeta(
  ctx: ReturnType<typeof fakeContext>,
): ResizablePanelMeta {
  return ctx.registerPanel.mock.calls[0]![0] as ResizablePanelMeta;
}

describe("useResizablePanel 尺寸", () => {
  it("store 里有值时用 store 的值", () => {
    const { result } = setup({ sizes: () => ({ a: 42 }) });

    expect(result.size()).toBe(42);
  });

  it("store 里没有时用 defaultSize 作为 fallback", () => {
    const { result } = setup({ sizes: () => ({}) }, { defaultSize: "40%" });

    expect(result.size()).toBe(40);
  });

  it("没有 defaultSize 时 fallback 为 1", () => {
    const { result } = setup({ sizes: () => ({}) });

    expect(result.size()).toBe(1);
  });
});

describe("useResizablePanel 注册", () => {
  it("把 props 解析成 meta（含百分比字符串）", () => {
    const { ctx, register } = setup(
      {},
      {
        defaultSize: 25,
        minSize: "10%",
        maxSize: "80%",
        collapsible: true,
        collapsedSize: 5,
      },
    );
    const element = document.createElement("div");

    register(element);

    const meta = registeredMeta(ctx);
    expect(meta.id).toBe("a");
    expect(meta.element).toBe(element);
    expect(meta.defaultSize).toBe(25);
    expect(meta.minSize()).toBe(10);
    expect(meta.maxSize()).toBe(80);
    expect(meta.collapsible()).toBe(true);
    expect(meta.collapsedSize()).toBe(5);
  });

  it("未指定 collapsible / collapsedSize 时给出默认值", () => {
    const { ctx, register } = setup();
    register(document.createElement("div"));

    const meta = registeredMeta(ctx);
    expect(meta.collapsible()).toBe(false);
    expect(meta.collapsedSize()).toBe(0);
    expect(meta.defaultSize).toBeUndefined();
    expect(meta.maxSize()).toBe(100);
  });

  it("非法尺寸回退到各自的默认值", () => {
    const { ctx, register } = setup({}, { minSize: "abc" as never });
    register(document.createElement("div"));

    expect(registeredMeta(ctx).minSize()).toBe(0);
  });

  it("把 meta 的回调转发给 props 回调", () => {
    const onResize = vi.fn();
    const onCollapse = vi.fn();
    const onExpand = vi.fn();
    const { ctx, register } = setup({}, { onResize, onCollapse, onExpand });
    register(document.createElement("div"));

    const meta = registeredMeta(ctx);
    meta.onResize?.(33);
    meta.onCollapse?.();
    meta.onExpand?.();

    expect(onResize).toHaveBeenCalledWith(33);
    expect(onCollapse).toHaveBeenCalledTimes(1);
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it("把命令式句柄交给 panelRef，卸载时置回 undefined", () => {
    const { ctx, register, panelRef, cleanup } = setup();
    register(document.createElement("div"));

    const handle = panelRef.mock.calls[0]![0];
    expect(handle.getSize()).toBe(30);
    expect(handle.isCollapsed()).toBe(false);
    expect(handle.isExpanded()).toBe(true);

    handle.collapse();
    handle.expand();
    handle.resize(15);
    expect(ctx.collapsePanel).toHaveBeenCalledWith("a");
    expect(ctx.expandPanel).toHaveBeenCalledWith("a");
    expect(ctx.setPanelSize).toHaveBeenCalledWith("a", 15);

    cleanup();
    expect(panelRef).toHaveBeenLastCalledWith(undefined);
  });

  it("卸载时调用 registerPanel 返回的注销函数", () => {
    const unregister = vi.fn();
    const { register, cleanup } = setup({
      registerPanel: vi.fn(() => unregister),
    } as never);
    register(document.createElement("div"));

    cleanup();

    expect(unregister).toHaveBeenCalledTimes(1);
  });
});
