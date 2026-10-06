import { describe, expect, it, vi } from "vitest";
import { createPanelRegistry } from "~/components/resizable/resizable.registry";
import type { ResizablePanelMeta } from "~/components/resizable/resizable.types";

function makeMeta(id: string): ResizablePanelMeta {
  return {
    id,
    element: document.createElement("div"),
    minSize: () => 0,
    maxSize: () => 100,
    collapsible: () => false,
    collapsedSize: () => 0,
    defaultSize: undefined,
  };
}

/** 按 DOM 顺序把节点挂到同一个父节点下，模拟真实的面板/handle 兄弟关系 */
function mount(...nodes: (HTMLElement | string)[]) {
  const root = document.createElement("div");
  for (const node of nodes) {
    root.appendChild(
      typeof node === "string" ? document.createTextNode(node) : node,
    );
  }
  document.body.appendChild(root);
  return root;
}

describe("PanelRegistry 注册顺序", () => {
  it("按注册顺序返回面板", () => {
    const registry = createPanelRegistry();
    const a = makeMeta("a");
    const b = makeMeta("b");

    registry.add(a);
    registry.add(b);

    expect(registry.ordered().map((meta) => meta.id)).toEqual(["a", "b"]);
  });

  it("移除后不再出现在顺序里", () => {
    const registry = createPanelRegistry();
    const a = makeMeta("a");
    const b = makeMeta("b");
    const c = makeMeta("c");

    registry.add(a);
    registry.add(b);
    registry.add(c);
    registry.remove(b);

    expect(registry.ordered().map((meta) => meta.id)).toEqual(["a", "c"]);
  });

  it("同一元素重复注册时顺序里出现两次（与既有语义一致，由调用方保证不重复）", () => {
    const registry = createPanelRegistry();
    const a = makeMeta("a");

    registry.add(a);
    registry.add(a);

    expect(registry.ordered()).toHaveLength(2);
  });
});

describe("PanelRegistry 相邻解析", () => {
  it("返回 handle 两侧的面板与尺寸之和", () => {
    const registry = createPanelRegistry();
    const prev = makeMeta("prev");
    const next = makeMeta("next");
    const handle = document.createElement("div");
    mount(prev.element, handle, next.element);
    registry.add(prev);
    registry.add(next);

    const getSize = vi.fn((id: string) => (id === "prev" ? 30 : 20));

    expect(registry.adjacent(handle, getSize)).toEqual({
      prev,
      next,
      prevSize: 30,
      total: 50,
    });
    expect(getSize).toHaveBeenCalledWith("prev");
    expect(getSize).toHaveBeenCalledWith("next");
  });

  it("跳过中间的非面板节点（把手装饰、文本节点）", () => {
    const registry = createPanelRegistry();
    const prev = makeMeta("prev");
    const next = makeMeta("next");
    const handle = document.createElement("div");
    const decoration = document.createElement("span");
    const decoration2 = document.createElement("span");
    mount(prev.element, decoration, handle, decoration2, next.element);
    registry.add(prev);
    registry.add(next);

    expect(registry.adjacent(handle, () => 10)?.prev.id).toBe("prev");
  });

  it("某一侧没有面板时返回 undefined", () => {
    const registry = createPanelRegistry();
    const prev = makeMeta("prev");
    const next = makeMeta("next");
    const firstHandle = document.createElement("div");
    const lastHandle = document.createElement("div");
    mount(firstHandle, prev.element, next.element, lastHandle);
    registry.add(prev);
    registry.add(next);

    expect(registry.adjacent(firstHandle, () => 10)).toBeUndefined();
    expect(registry.adjacent(lastHandle, () => 10)).toBeUndefined();
  });

  it("单个面板时任何 handle 都解析不到相邻对", () => {
    const registry = createPanelRegistry();
    const only = makeMeta("only");
    const handle = document.createElement("div");
    mount(only.element, handle);
    registry.add(only);

    expect(registry.adjacent(handle, () => 100)).toBeUndefined();
  });

  it("尺寸缺省时按 0 参与求和", () => {
    const registry = createPanelRegistry();
    const prev = makeMeta("prev");
    const next = makeMeta("next");
    const handle = document.createElement("div");
    mount(prev.element, handle, next.element);
    registry.add(prev);
    registry.add(next);

    expect(registry.adjacent(handle, () => 0)?.total).toBe(0);
  });
});

describe("PanelRegistry 前后邻居", () => {
  it("中间面板同时有前后邻居", () => {
    const registry = createPanelRegistry();
    const a = makeMeta("a");
    const b = makeMeta("b");
    const c = makeMeta("c");
    registry.add(a);
    registry.add(b);
    registry.add(c);

    expect(registry.neighbors(b)).toEqual({ prev: a, next: c });
  });

  it("首个面板没有前邻居", () => {
    const registry = createPanelRegistry();
    const a = makeMeta("a");
    const b = makeMeta("b");
    registry.add(a);
    registry.add(b);

    expect(registry.neighbors(a)).toEqual({ prev: undefined, next: b });
  });

  it("最后一个面板没有后邻居", () => {
    const registry = createPanelRegistry();
    const a = makeMeta("a");
    const b = makeMeta("b");
    registry.add(a);
    registry.add(b);

    expect(registry.neighbors(b)).toEqual({ prev: a, next: undefined });
  });

  it("唯一面板两侧都没有邻居", () => {
    const registry = createPanelRegistry();
    const a = makeMeta("a");
    registry.add(a);

    expect(registry.neighbors(a)).toEqual({ prev: undefined, next: undefined });
  });

  it("未注册的面板不参与邻居解析（按 DOM 顺序取下标）", () => {
    const registry = createPanelRegistry();
    const a = makeMeta("a");
    const b = makeMeta("b");
    const orphan = makeMeta("orphan");
    registry.add(a);
    registry.add(b);

    // indexOf 返回 -1 → order[0] 成为「后邻居」，与前实现一致
    expect(registry.neighbors(orphan)).toEqual({ prev: undefined, next: a });
  });
});
