import { describe, expect, it, vi } from "vitest";
import { createPanelCommands } from "~/components/resizable/resizable.commands";
import type { PanelRegistry } from "~/components/resizable/resizable.registry";
import { createPanelSizes } from "~/components/resizable/resizable.sizes";
import type { ResizablePanelMeta } from "~/components/resizable/resizable.types";

function meta(id: string, overrides: Partial<ResizablePanelMeta> = {}) {
  return {
    id,
    element: document.createElement("div"),
    minSize: () => 10,
    maxSize: () => 100,
    collapsible: () => true,
    collapsedSize: () => 0,
    defaultSize: undefined,
    ...overrides,
  } satisfies ResizablePanelMeta;
}

function setup(options: {
  metas: ResizablePanelMeta[];
  initial: Record<string, number>;
  adjacent?:
    | {
        prev: ResizablePanelMeta;
        next: ResizablePanelMeta;
        prevSize: number;
        total: number;
      }
    | undefined;
  /** 覆盖相邻对解析（默认按注册顺序取前后邻居） */
  neighbors?: (meta: ResizablePanelMeta) => {
    prev: ResizablePanelMeta | undefined;
    next: ResizablePanelMeta | undefined;
  };
}) {
  const commit = vi.fn();
  const registry = {
    adjacent: () => options.adjacent,
    neighbors:
      options.neighbors ??
      ((target: ResizablePanelMeta) => {
        const index = options.metas.indexOf(target);
        return {
          prev: index > 0 ? options.metas[index - 1] : undefined,
          next:
            index >= 0 && index < options.metas.length - 1
              ? options.metas[index + 1]
              : undefined,
        };
      }),
  } as unknown as PanelRegistry;

  const sizes = createPanelSizes({
    metas: () => options.metas,
    registry,
    reportSizeChange: vi.fn(),
  });
  sizes.applyAll(
    options.metas.map((item) => options.initial[item.id] ?? 0),
    false,
  );

  const commands = createPanelCommands({
    metas: () => options.metas,
    registry,
    sizes,
    commit,
  });

  return { commands, sizes, commit };
}

/** 双面板夹具：a、b 相邻，总量恒为 100 —— 单面板会走"独苗占满 100"分支 */
function pair(
  aOverrides: Partial<ResizablePanelMeta> = {},
  bOverrides: Partial<ResizablePanelMeta> = {},
) {
  return [meta("a", aOverrides), meta("b", bOverrides)] as const;
}

describe("createPanelCommands collapsePanel", () => {
  it("折叠可折叠面板：写入折叠尺寸、总量守恒并提交", () => {
    const metas = pair({ collapsedSize: () => 5 });
    const { commands, sizes, commit } = setup({
      metas: [...metas],
      initial: { a: 50, b: 50 },
    });

    expect(commands.collapsePanel("a")).toBe(true);
    expect(sizes.sizeOf("a")).toBe(5);
    expect(sizes.sizeOf("b")).toBe(95);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("不可折叠的面板返回 false 且不写尺寸", () => {
    const metas = pair({ collapsible: () => false });
    const { commands, sizes, commit } = setup({
      metas: [...metas],
      initial: { a: 50, b: 50 },
    });

    expect(commands.collapsePanel("a")).toBe(false);
    expect(sizes.sizeOf("a")).toBe(50);
    expect(commit).not.toHaveBeenCalled();
  });

  it("已经折叠的面板再折叠返回 false（幂等）", () => {
    const metas = pair({ collapsedSize: () => 5 });
    const { commands, commit } = setup({
      metas: [...metas],
      initial: { a: 5, b: 95 },
    });

    expect(commands.collapsePanel("a")).toBe(false);
    expect(commit).not.toHaveBeenCalled();
  });

  it("面板不存在时返回 false", () => {
    const metas = pair();
    const { commands, commit } = setup({
      metas: [...metas],
      initial: { a: 50, b: 50 },
    });

    expect(commands.collapsePanel("missing")).toBe(false);
    expect(commit).not.toHaveBeenCalled();
  });
});

describe("createPanelCommands expandPanel", () => {
  it("展开时回到折叠前的尺寸", () => {
    const metas = pair({ collapsedSize: () => 5 });
    const { commands, sizes } = setup({
      metas: [...metas],
      initial: { a: 50, b: 50 },
    });
    commands.collapsePanel("a");

    expect(commands.expandPanel("a")).toBe(true);
    expect(sizes.sizeOf("a")).toBe(50);
    expect(sizes.sizeOf("b")).toBe(50);
  });

  it("没有折叠记忆时用 minSize", () => {
    const metas = pair({
      collapsedSize: () => 5,
      minSize: () => 25,
    });
    const { commands, sizes } = setup({
      metas: [...metas],
      initial: { a: 5, b: 95 },
    });

    expect(commands.expandPanel("a")).toBe(true);
    expect(sizes.sizeOf("a")).toBe(25);
  });

  it("记忆值小于 minSize 时按 minSize 展开", () => {
    const metas = pair({ collapsedSize: () => 5, minSize: () => 40 });
    const { commands, sizes } = setup({
      metas: [...metas],
      initial: { a: 20, b: 80 },
    });
    commands.collapsePanel("a");

    expect(commands.expandPanel("a")).toBe(true);
    expect(sizes.sizeOf("a")).toBe(40);
  });

  it("不可折叠的面板返回 false", () => {
    const metas = pair({ collapsible: () => false });
    const { commands, commit } = setup({
      metas: [...metas],
      initial: { a: 5, b: 95 },
    });

    expect(commands.expandPanel("a")).toBe(false);
    expect(commit).not.toHaveBeenCalled();
  });

  it("没有折叠的面板展开返回 false", () => {
    const metas = pair({ collapsedSize: () => 5 });
    const { commands, commit } = setup({
      metas: [...metas],
      initial: { a: 50, b: 50 },
    });

    expect(commands.expandPanel("a")).toBe(false);
    expect(commit).not.toHaveBeenCalled();
  });

  it("面板不存在时返回 false", () => {
    const metas = pair();
    const { commands } = setup({
      metas: [...metas],
      initial: { a: 50, b: 50 },
    });

    expect(commands.expandPanel("missing")).toBe(false);
  });
});

describe("createPanelCommands setPanelSize", () => {
  it("设置已有面板的尺寸并提交", () => {
    const metas = pair();
    const { commands, sizes, commit } = setup({
      metas: [...metas],
      initial: { a: 50, b: 50 },
    });

    commands.setPanelSize("a", 30);

    expect(sizes.sizeOf("a")).toBe(30);
    expect(sizes.sizeOf("b")).toBe(70);
    expect(commit).toHaveBeenCalledTimes(1);
  });

  it("面板不存在时是空操作", () => {
    const metas = pair();
    const { commands, commit } = setup({
      metas: [...metas],
      initial: { a: 50, b: 50 },
    });

    commands.setPanelSize("missing", 30);

    expect(commit).not.toHaveBeenCalled();
  });
});

describe("createPanelCommands isPanelCollapsed", () => {
  it("尺寸等于折叠尺寸时为 true", () => {
    const metas = pair({ collapsedSize: () => 5 });
    const { commands } = setup({
      metas: [...metas],
      initial: { a: 5, b: 95 },
    });

    expect(commands.isPanelCollapsed("a")).toBe(true);
  });

  it("尺寸大于折叠尺寸时为 false", () => {
    const metas = pair({ collapsedSize: () => 5 });
    const { commands } = setup({
      metas: [...metas],
      initial: { a: 50, b: 50 },
    });

    expect(commands.isPanelCollapsed("a")).toBe(false);
  });

  it("面板不存在时为 false", () => {
    const metas = pair({ collapsedSize: () => 5 });
    const { commands } = setup({
      metas: [...metas],
      initial: { a: 5, b: 95 },
    });

    expect(commands.isPanelCollapsed("missing")).toBe(false);
  });
});

describe("createPanelCommands toggleHandleCollapse", () => {
  const handle = document.createElement("div");

  it("没有相邻面板时空操作", () => {
    const metas = pair();
    const { commands, commit } = setup({
      metas: [...metas],
      initial: { a: 50, b: 50 },
      adjacent: undefined,
    });

    commands.toggleHandleCollapse(handle);

    expect(commit).not.toHaveBeenCalled();
  });

  it("两侧都不可折叠时空操作", () => {
    const prev = meta("prev", { collapsible: () => false });
    const next = meta("next", { collapsible: () => false });
    const { commands, commit } = setup({
      metas: [prev, next],
      initial: { prev: 50, next: 50 },
      adjacent: { prev, next, prevSize: 50, total: 100 },
    });

    commands.toggleHandleCollapse(handle);

    expect(commit).not.toHaveBeenCalled();
  });

  it("目标已折叠时执行展开", () => {
    const [prev, next] = pair({ collapsedSize: () => 0 });
    const { commands, sizes } = setup({
      metas: [prev!, next!],
      initial: { a: 0, b: 100 },
      adjacent: { prev: prev!, next: next!, prevSize: 0, total: 100 },
    });

    commands.toggleHandleCollapse(handle);

    expect(commands.isPanelCollapsed("a")).toBe(false);
    expect(sizes.sizeOf("a")).toBeGreaterThan(0);
  });

  it("目标未折叠时执行折叠", () => {
    const [prev, next] = pair({ collapsedSize: () => 0 });
    const { commands } = setup({
      metas: [prev!, next!],
      initial: { a: 60, b: 40 },
      adjacent: { prev: prev!, next: next!, prevSize: 60, total: 100 },
    });

    commands.toggleHandleCollapse(handle);

    expect(commands.isPanelCollapsed("a")).toBe(true);
  });
});
