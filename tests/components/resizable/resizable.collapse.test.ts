import { describe, expect, it } from "vitest";
import {
  createCollapseMemory,
  nextCollapseAction,
} from "~/components/resizable/resizable.collapse";
import type { ResizablePanelMeta } from "~/components/resizable/resizable.types";

function makeMeta(
  id: string,
  collapsible: boolean,
  collapsedSize = 0,
): ResizablePanelMeta {
  return {
    id,
    element: document.createElement("div"),
    minSize: () => 0,
    maxSize: () => 100,
    collapsible: () => collapsible,
    collapsedSize: () => collapsedSize,
    defaultSize: undefined,
  };
}

describe("nextCollapseAction", () => {
  it("优先对前一个可折叠面板折叠", () => {
    const decision = nextCollapseAction(
      { prev: makeMeta("prev", true), next: makeMeta("next", false) },
      () => 40,
    );

    expect(decision).toEqual({ id: "prev", action: "collapse" });
  });

  it("前一个不可折叠时退到后一个", () => {
    const decision = nextCollapseAction(
      { prev: makeMeta("prev", false), next: makeMeta("next", true) },
      () => 40,
    );

    expect(decision).toEqual({ id: "next", action: "collapse" });
  });

  it("目标已折叠时给出展开动作", () => {
    const decision = nextCollapseAction(
      { prev: makeMeta("prev", true, 10), next: makeMeta("next", false) },
      () => 10,
    );

    expect(decision).toEqual({ id: "prev", action: "expand" });
  });

  it("折叠容差内的尺寸仍视为已折叠", () => {
    const decision = nextCollapseAction(
      { prev: makeMeta("prev", true, 10), next: makeMeta("next", false) },
      () => 10.001,
    );

    expect(decision?.action).toBe("expand");
  });

  it("两侧都不可折叠时不动作", () => {
    expect(
      nextCollapseAction(
        { prev: makeMeta("prev", false), next: makeMeta("next", false) },
        () => 40,
      ),
    ).toBeUndefined();
  });

  it("两侧都可折叠时只动前一个", () => {
    const decision = nextCollapseAction(
      { prev: makeMeta("prev", true), next: makeMeta("next", true) },
      () => 40,
    );

    expect(decision).toEqual({ id: "prev", action: "collapse" });
  });

  it("尺寸通过 getSize 按 id 读取（不缓存）", () => {
    const sizes: Record<string, number> = { prev: 30, next: 70 };
    const decision = nextCollapseAction(
      { prev: makeMeta("prev", true), next: makeMeta("next", false) },
      (id) => sizes[id] ?? 0,
    );

    expect(decision?.action).toBe("collapse");
  });
});

describe("createCollapseMemory", () => {
  it("记住后能取回原尺寸", () => {
    const memory = createCollapseMemory();

    memory.remember("a", 42);

    expect(memory.recall("a", 0)).toBe(42);
  });

  it("没有记忆时用兜底值", () => {
    const memory = createCollapseMemory();

    expect(memory.recall("missing", 7)).toBe(7);
  });

  it("再次记忆会覆盖旧值", () => {
    const memory = createCollapseMemory();

    memory.remember("a", 10);
    memory.remember("a", 25);

    expect(memory.recall("a", 0)).toBe(25);
  });

  it("不同面板的记忆互不影响", () => {
    const memory = createCollapseMemory();

    memory.remember("a", 10);
    memory.remember("b", 20);

    expect(memory.recall("a", 0)).toBe(10);
    expect(memory.recall("b", 0)).toBe(20);
  });

  it("0 是合法记忆值（不会被兜底顶替）", () => {
    const memory = createCollapseMemory();

    memory.remember("a", 0);

    expect(memory.recall("a", 99)).toBe(0);
  });
});
