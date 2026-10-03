import { fireEvent, render } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResizableHandle } from "~/components/resizable/ResizableHandle";
import { ResizablePanel } from "~/components/resizable/ResizablePanel";
import { ResizablePanelGroup } from "~/components/resizable/ResizablePanelGroup";
import type { ResizablePanelHandle } from "~/components/resizable/resizable.types";

/**
 * jsdom 没有 Pointer Events 的 capture 系列 API，而 Handle 的拖拽依赖它们。
 * 这里补一份最小可控实现（TESTING.md §4.5：只补系统边界，且要能显式驱动分支）。
 */
const captured = new Set<number>();

/** rAF 排队执行：拖拽的 px→% 合并依赖「帧回调晚于 pointermove」这一时序 */
let frames: FrameRequestCallback[] = [];
let nextFrameId = 0;

function flushFrames() {
  const pending = frames;
  frames = [];
  for (const callback of pending) callback(0);
}

beforeEach(() => {
  frames = [];
  nextFrameId = 0;
  captured.clear();
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.push(cb);
    return ++nextFrameId;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  Object.assign(Element.prototype, {
    setPointerCapture(id: number) {
      captured.add(id);
    },
    hasPointerCapture(id: number) {
      return captured.has(id);
    },
    releasePointerCapture(id: number) {
      captured.delete(id);
    },
  });
});

afterEach(() => {
  for (const key of [
    "setPointerCapture",
    "hasPointerCapture",
    "releasePointerCapture",
  ]) {
    Reflect.deleteProperty(Element.prototype, key);
  }
});

interface LayoutOptions {
  orientation?: "horizontal" | "vertical";
  disabled?: boolean;
  withHandle?: boolean;
  onDragging?: (dragging: boolean) => void;
  onLayoutChange?: (layout: Record<string, number>) => void;
  groupSizePx?: number;
}

/** 两面板 + 一分隔条的最小组合 */
function renderLayout(options: LayoutOptions = {}) {
  const result = render(() => (
    <ResizablePanelGroup
      orientation={options.orientation}
      onLayoutChange={options.onLayoutChange}
    >
      <ResizablePanel id="a" defaultSize={50}>
        面板 A
      </ResizablePanel>
      <ResizableHandle
        disabled={options.disabled}
        withHandle={options.withHandle}
        onDragging={options.onDragging}
        aria-label="调整"
      />
      <ResizablePanel id="b" defaultSize={50}>
        面板 B
      </ResizablePanel>
    </ResizablePanelGroup>
  ));

  const group = () =>
    result.container.querySelector(
      '[data-slot="resizable-panel-group"]',
    ) as HTMLElement;
  const handle = () =>
    result.container.querySelector(
      '[data-slot="resizable-handle"]',
    ) as HTMLElement;
  const panels = () =>
    Array.from(
      result.container.querySelectorAll('[data-slot="resizable-panel"]'),
    ) as HTMLElement[];

  // jsdom 没有布局：主轴尺寸显式给一个值，让 px→% 换算可预期
  const size = options.groupSizePx ?? 400;
  Object.defineProperty(group(), "clientWidth", {
    value: options.orientation === "vertical" ? 0 : size,
    configurable: true,
  });
  Object.defineProperty(group(), "clientHeight", {
    value: options.orientation === "vertical" ? size : 0,
    configurable: true,
  });

  return { ...result, group, handle, panels };
}

/** 初始化在 queueMicrotask 里执行，等它落地 */
async function flushInit() {
  await Promise.resolve();
  await Promise.resolve();
}

function pointerDown(target: HTMLElement, init: PointerEventInit = {}) {
  fireEvent.pointerDown(target, {
    button: 0,
    pointerId: 1,
    clientX: 100,
    clientY: 100,
    ...init,
  });
}

function pointerMove(target: HTMLElement, init: PointerEventInit = {}) {
  fireEvent.pointerMove(target, {
    pointerId: 1,
    clientX: 100,
    clientY: 100,
    ...init,
  });
}

function pointerUp(target: HTMLElement, init: PointerEventInit = {}) {
  fireEvent.pointerUp(target, { pointerId: 1, ...init });
}

describe("ResizablePanelGroup", () => {
  it("默认横向：role / data-slot / data-orientation / 类名", () => {
    const { group } = renderLayout();

    expect(group()).toHaveAttribute("role", "group");
    expect(group()).toHaveAttribute("data-slot", "resizable-panel-group");
    expect(group()).toHaveAttribute("data-orientation", "horizontal");
    expect(group()).toHaveClass("flex");
  });

  it("vertical 时写进 data-orientation", () => {
    const { group } = renderLayout({ orientation: "vertical" });

    expect(group()).toHaveAttribute("data-orientation", "vertical");
  });

  it("透传其余属性与 classList", () => {
    const { container } = render(() => (
      <ResizablePanelGroup data-testid="group" class="my-class" />
    ));
    const group = container.querySelector(
      '[data-slot="resizable-panel-group"]',
    ) as HTMLElement;

    expect(group).toHaveAttribute("data-testid", "group");
    expect(group).toHaveClass("my-class");
  });

  it("拖拽期间注入全局光标样式并禁用文本选择，结束后还原", async () => {
    const { group, handle } = renderLayout();
    await flushInit();

    expect(document.querySelector("[data-resizable-drag]")).toBeNull();

    pointerDown(handle());

    const sheet = document.querySelector("[data-resizable-drag]");
    expect(sheet).not.toBeNull();
    expect(sheet?.textContent).toContain("cursor: ew-resize !important");
    expect(document.body.style.userSelect).toBe("none");
    expect(group()).toHaveAttribute("data-dragging", "");

    pointerUp(handle());

    expect(document.querySelector("[data-resizable-drag]")).toBeNull();
    expect(document.body.style.userSelect).toBe("");
  });

  it("纵向拖拽使用 ns-resize 光标", async () => {
    const { handle } = renderLayout({ orientation: "vertical" });
    await flushInit();

    pointerDown(handle());

    expect(
      document.querySelector("[data-resizable-drag]")?.textContent,
    ).toContain("cursor: ns-resize !important");
  });
});

describe("ResizablePanel", () => {
  it("显式 id 与自动 id 都写进 data-panel-id", async () => {
    const { panels } = renderLayout();
    await flushInit();

    expect(panels()[0]).toHaveAttribute("data-panel-id", "a");
    expect(panels()[0]).toHaveAttribute("id", "a");
    expect(panels()[1]).toHaveAttribute("data-panel-id", "b");
  });

  it("初始化后 data-panel-size 反映归一化后的百分比", async () => {
    const { panels } = renderLayout();
    await flushInit();

    expect(panels()[0]).toHaveAttribute("data-panel-size", "50");
    expect(panels()[0].style.flexGrow).toBe("50");
  });

  it("初始化前用 defaultSize 作为 fallback", () => {
    const { panels } = renderLayout();

    expect(panels()[0]).toHaveAttribute("data-panel-size", "50");
  });

  it("未指定 id 时自动生成 data-panel-id", async () => {
    const { container } = render(() => (
      <ResizablePanelGroup>
        <ResizablePanel>A</ResizablePanel>
      </ResizablePanelGroup>
    ));
    await flushInit();
    const panel = container.querySelector(
      '[data-slot="resizable-panel"]',
    ) as HTMLElement;

    const id = panel.getAttribute("data-panel-id");
    expect(id).toBeTruthy();
    // 自动 id 不写到 DOM 的 id 属性上（只有显式传入才透传）
    expect(panel).not.toHaveAttribute("id");
  });

  it("未指定 defaultSize 时 fallback 权重为 1", () => {
    const { container } = render(() => (
      <ResizablePanelGroup>
        <ResizablePanel id="only">A</ResizablePanel>
      </ResizablePanelGroup>
    ));

    expect(
      container.querySelector('[data-slot="resizable-panel"]'),
    ).toHaveAttribute("data-panel-size", "1");
  });

  it("style 传字符串时直接追加", () => {
    const { container } = render(() => (
      <ResizablePanelGroup>
        {/* 字符串 style 是运行时支持的写法（TS 类型只声明对象），用断言绕开类型 */}
        <ResizablePanel id="a" style={"background: red" as never}>
          A
        </ResizablePanel>
      </ResizablePanelGroup>
    ));
    const panel = container.querySelector(
      '[data-slot="resizable-panel"]',
    ) as HTMLElement;

    expect(panel.style.background).toBe("red");
    expect(panel.style.flexShrink).toBe("1");
    expect(panel.style.flexBasis).toBe("0%");
  });

  it("style 传对象时转成 kebab-case，跳过 null/undefined", () => {
    const { container } = render(() => (
      <ResizablePanelGroup>
        <ResizablePanel
          id="a"
          style={
            {
              backgroundColor: "red",
              borderTopWidth: undefined,
            } as never
          }
        >
          A
        </ResizablePanel>
      </ResizablePanelGroup>
    ));
    const panel = container.querySelector(
      '[data-slot="resizable-panel"]',
    ) as HTMLElement;

    expect(panel.style.backgroundColor).toBe("red");
    expect(panel.getAttribute("style")).not.toContain("border-top-width");
  });

  it("脱离 ResizablePanelGroup 使用时抛出中文错误", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      render(() => <ResizablePanel id="a">A</ResizablePanel>),
    ).toThrow("<ResizablePanel> 必须渲染在 <ResizablePanelGroup> 内部");

    spy.mockRestore();
  });
});

describe("ResizablePanel 命令式句柄", () => {
  function renderHandleFixture() {
    const [handle, setHandle] = createSignal<ResizablePanelHandle>();
    const events: string[] = [];
    const result = render(() => (
      <ResizablePanelGroup>
        <ResizablePanel
          id="a"
          defaultSize={50}
          collapsible
          collapsedSize={0}
          minSize={10}
          panelRef={setHandle}
          onResize={(size) => events.push(`resize:${size}`)}
          onCollapse={() => events.push("collapse")}
          onExpand={() => events.push("expand")}
        >
          A
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel id="b" defaultSize={50}>
          B
        </ResizablePanel>
      </ResizablePanelGroup>
    ));

    const panel = () =>
      result.container.querySelector(
        '[data-slot="resizable-panel"]',
      ) as HTMLElement;

    return { ...result, handle, events, panel };
  }

  it("暴露 collapse / expand / resize / getSize / isCollapsed / isExpanded", async () => {
    const { handle, panel } = renderHandleFixture();
    await flushInit();

    expect(handle()?.getSize()).toBe(50);
    expect(handle()?.isCollapsed()).toBe(false);
    expect(handle()?.isExpanded()).toBe(true);

    expect(handle()?.collapse()).toBe(true);
    expect(handle()?.isCollapsed()).toBe(true);
    expect(panel()).toHaveAttribute("data-panel-collapsed", "");
    expect(handle()?.getSize()).toBe(0);

    expect(handle()?.expand()).toBe(true);
    expect(handle()?.isCollapsed()).toBe(false);
    expect(panel()).not.toHaveAttribute("data-panel-collapsed");
    // 折叠前记忆的尺寸
    expect(handle()?.getSize()).toBe(50);

    handle()?.resize(20);
    expect(handle()?.getSize()).toBe(20);
  });

  it("onResize / onCollapse / onExpand 随命令式操作触发", async () => {
    const { handle, events } = renderHandleFixture();
    await flushInit();

    handle()?.collapse();
    handle()?.expand();

    expect(events).toEqual(["resize:0", "collapse", "resize:50", "expand"]);
  });

  it("只有一个面板时 resize 直接把它设为 100%（没有相邻可分配）", async () => {
    const [handle, setHandle] = createSignal<ResizablePanelHandle>();
    const { container } = render(() => (
      <ResizablePanelGroup>
        <ResizablePanel id="only" panelRef={setHandle}>
          A
        </ResizablePanel>
      </ResizablePanelGroup>
    ));
    await flushInit();

    handle()?.resize(30);

    expect(
      container.querySelector('[data-slot="resizable-panel"]'),
    ).toHaveAttribute("data-panel-size", "100");
  });

  it("只有后邻居时 resize 通过与它重新分配", async () => {
    const [handle, setHandle] = createSignal<ResizablePanelHandle>();
    const { container } = render(() => (
      <ResizablePanelGroup>
        <ResizablePanel id="a" defaultSize={50}>
          A
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel id="b" defaultSize={50} panelRef={setHandle}>
          B
        </ResizablePanel>
      </ResizablePanelGroup>
    ));
    await flushInit();

    handle()?.resize(30);

    const panels = container.querySelectorAll('[data-slot="resizable-panel"]');
    expect(panels[0]).toHaveAttribute("data-panel-size", "70");
    expect(panels[1]).toHaveAttribute("data-panel-size", "30");
  });

  it("不可折叠的面板 collapse/expand 返回 false", async () => {
    const [handle, setHandle] = createSignal<ResizablePanelHandle>();
    render(() => (
      <ResizablePanelGroup>
        <ResizablePanel id="a" panelRef={setHandle}>
          A
        </ResizablePanel>
      </ResizablePanelGroup>
    ));

    expect(handle()?.collapse()).toBe(false);
    expect(handle()?.expand()).toBe(false);
  });

  it("卸载时把句柄置回 undefined", async () => {
    const { handle, unmount } = renderHandleFixture();
    await flushInit();

    unmount();

    expect(handle()).toBeUndefined();
  });
});

describe("ResizableHandle 无障碍契约", () => {
  it("横向 group 里分隔条是 vertical，并给出 aria-value*", async () => {
    const { handle } = renderLayout();
    await flushInit();

    expect(handle()).toHaveAttribute("role", "separator");
    expect(handle()).toHaveAttribute("aria-orientation", "vertical");
    expect(handle()).toHaveAttribute("aria-valuenow", "50");
    expect(handle()).toHaveAttribute("aria-valuemin", "0");
    expect(handle()).toHaveAttribute("aria-valuemax", "100");
    expect(handle()).toHaveAttribute("tabindex", "0");
  });

  it("纵向 group 里分隔条是 horizontal", () => {
    const { handle } = renderLayout({ orientation: "vertical" });

    expect(handle()).toHaveAttribute("aria-orientation", "horizontal");
    expect(handle()).toHaveAttribute("data-orientation", "vertical");
  });

  it("disabled 时不可聚焦并标记 data-disabled", () => {
    const { handle } = renderLayout({ disabled: true });

    expect(handle()).toHaveAttribute("tabindex", "-1");
    expect(handle()).toHaveAttribute("data-disabled", "");
  });

  it("withHandle 时渲染抓手", () => {
    const { handle } = renderLayout({ withHandle: true });

    expect(handle().querySelector("div")).not.toBeNull();
  });

  it("默认不渲染抓手", () => {
    const { handle } = renderLayout();

    expect(handle().querySelector("div")).toBeNull();
  });

  it("没有相邻面板时 aria-value* 回退到默认值", () => {
    const { container } = render(() => (
      <ResizablePanelGroup>
        <ResizableHandle />
      </ResizablePanelGroup>
    ));
    const handle = container.querySelector(
      '[data-slot="resizable-handle"]',
    ) as HTMLElement;

    expect(handle).toHaveAttribute("aria-valuenow", "0");
    expect(handle).toHaveAttribute("aria-valuemax", "100");
  });
});

describe("ResizableHandle 键盘调整", () => {
  async function setup(options: LayoutOptions = {}) {
    const layout = renderLayout(options);
    await flushInit();
    return layout;
  }

  it("ArrowRight 向右增大前一个面板（横向，kb 10px / 400px => 2.5%）", async () => {
    const { handle, panels } = await setup();

    fireEvent.keyDown(handle(), { key: "ArrowRight" });

    expect(panels()[0]).toHaveAttribute("data-panel-size", "52.5");
    expect(panels()[1]).toHaveAttribute("data-panel-size", "47.5");
    // 回归：aria-valuenow 必须跟随尺寸（注册表变化 + store 更新都要能重算）
    expect(handle()).toHaveAttribute("aria-valuenow", "53");
  });

  it("ArrowLeft 向左减小前一个面板", async () => {
    const { handle, panels } = await setup();

    fireEvent.keyDown(handle(), { key: "ArrowLeft" });

    expect(panels()[0]).toHaveAttribute("data-panel-size", "47.5");
  });

  it("ArrowDown / ArrowUp 在纵向布局下调整", async () => {
    const { handle, panels } = await setup({ orientation: "vertical" });

    fireEvent.keyDown(handle(), { key: "ArrowDown" });
    expect(panels()[0]).toHaveAttribute("data-panel-size", "52.5");

    fireEvent.keyDown(handle(), { key: "ArrowUp" });
    expect(panels()[0]).toHaveAttribute("data-panel-size", "50");
  });

  it("RTL 横向时方向取反", async () => {
    const { handle, group, panels } = await setup();
    group().style.direction = "rtl";

    fireEvent.keyDown(handle(), { key: "ArrowRight" });

    expect(panels()[0]).toHaveAttribute("data-panel-size", "47.5");
  });

  it("Home 把前一个面板收到 0，End 推到总和", async () => {
    const { handle, panels } = await setup();

    fireEvent.keyDown(handle(), { key: "Home" });
    expect(panels()[0]).toHaveAttribute("data-panel-size", "0");
    expect(panels()[1]).toHaveAttribute("data-panel-size", "100");

    fireEvent.keyDown(handle(), { key: "End" });
    expect(panels()[0]).toHaveAttribute("data-panel-size", "100");
    expect(panels()[1]).toHaveAttribute("data-panel-size", "0");
  });

  it("Enter / Space 切换折叠（可折叠的一侧）", async () => {
    const result = render(() => (
      <ResizablePanelGroup>
        <ResizablePanel id="a" defaultSize={50} collapsible collapsedSize={0}>
          A
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel id="b" defaultSize={50}>
          B
        </ResizablePanel>
      </ResizablePanelGroup>
    ));
    await flushInit();
    const handle = result.container.querySelector(
      '[data-slot="resizable-handle"]',
    ) as HTMLElement;
    const panel = result.container.querySelector(
      '[data-slot="resizable-panel"]',
    ) as HTMLElement;

    fireEvent.keyDown(handle, { key: "Enter" });
    expect(panel).toHaveAttribute("data-panel-collapsed", "");

    fireEvent.keyDown(handle, { key: " " });
    expect(panel).not.toHaveAttribute("data-panel-collapsed");
  });

  it("前一个不可折叠、后一个可折叠时切换的是后一个（折叠后再展开）", async () => {
    const result = render(() => (
      <ResizablePanelGroup>
        <ResizablePanel id="a" defaultSize={50}>
          A
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel id="b" defaultSize={50} collapsible collapsedSize={0}>
          B
        </ResizablePanel>
      </ResizablePanelGroup>
    ));
    await flushInit();
    const handle = result.container.querySelector(
      '[data-slot="resizable-handle"]',
    ) as HTMLElement;
    const panels = result.container.querySelectorAll(
      '[data-slot="resizable-panel"]',
    );

    fireEvent.keyDown(handle, { key: "Enter" });
    expect(panels[1]).toHaveAttribute("data-panel-collapsed", "");

    fireEvent.keyDown(handle, { key: "Enter" });
    expect(panels[1]).not.toHaveAttribute("data-panel-collapsed");
    expect(panels[1]).toHaveAttribute("data-panel-size", "50");
  });

  it("两侧都不可折叠时 Enter 不改变布局", async () => {
    const { handle, panels } = await setup();

    fireEvent.keyDown(handle(), { key: "Enter" });

    expect(panels()[0]).toHaveAttribute("data-panel-size", "50");
    expect(panels()[1]).toHaveAttribute("data-panel-size", "50");
  });

  it("无法识别的按键不阻止默认行为", async () => {
    const { handle } = await setup();

    const event = new KeyboardEvent("keydown", {
      key: "a",
      bubbles: true,
      cancelable: true,
    });
    handle().dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it("disabled 时按键不产生任何调整", async () => {
    const { handle, panels } = await setup({ disabled: true });

    fireEvent.keyDown(handle(), { key: "ArrowRight" });

    expect(panels()[0]).toHaveAttribute("data-panel-size", "50");
  });

  it("RTL 横向时 ArrowLeft 增大前一个面板", async () => {
    const { handle, group, panels } = await setup();
    group().style.direction = "rtl";

    fireEvent.keyDown(handle(), { key: "ArrowLeft" });

    expect(panels()[0]).toHaveAttribute("data-panel-size", "52.5");
  });

  it("没有相邻面板时 Home/End 是空操作", async () => {
    const { container } = render(() => (
      <ResizablePanelGroup>
        <ResizableHandle />
      </ResizablePanelGroup>
    ));
    const handle = container.querySelector(
      '[data-slot="resizable-handle"]',
    ) as HTMLElement;

    fireEvent.keyDown(handle, { key: "Home" });
    fireEvent.keyDown(handle, { key: "End" });

    expect(container.querySelector('[data-slot="resizable-panel"]')).toBeNull();
  });
});

describe("ResizableHandle 指针拖拽", () => {
  async function setup(options: LayoutOptions = {}) {
    const layout = renderLayout(options);
    await flushInit();
    return layout;
  }

  it("拖拽先记录起点，pointermove 由 rAF 合并后写入布局，pointerup 提交", async () => {
    const onLayoutChange = vi.fn();
    const onDragging = vi.fn();
    const { handle, panels } = await setup({ onLayoutChange, onDragging });

    pointerDown(handle(), { clientX: 100 });
    expect(onDragging).toHaveBeenCalledWith(true);

    pointerMove(handle(), { clientX: 140 });
    // 还没到帧回调：布局未变
    expect(panels()[0]).toHaveAttribute("data-panel-size", "50");

    flushFrames();
    expect(panels()[0]).toHaveAttribute("data-panel-size", "60");

    pointerUp(handle());
    expect(onDragging).toHaveBeenLastCalledWith(false);
    expect(onLayoutChange).toHaveBeenCalled();
  });

  it("一帧内多次 pointermove 只写一次布局（取最后一次位置）", async () => {
    const { handle, panels } = await setup();

    pointerDown(handle(), { clientX: 100 });
    pointerMove(handle(), { clientX: 120 });
    pointerMove(handle(), { clientX: 160 });

    flushFrames();

    expect(panels()[0]).toHaveAttribute("data-panel-size", "65");
  });

  it("pointerup 时若还有未落地的帧，先结算再结束", async () => {
    const { handle, panels } = await setup();

    pointerDown(handle(), { clientX: 100 });
    pointerMove(handle(), { clientX: 140 });
    pointerUp(handle());

    expect(panels()[0]).toHaveAttribute("data-panel-size", "60");
  });

  it("纵向布局用 clientY 作为主轴", async () => {
    const { handle, panels } = await setup({ orientation: "vertical" });

    pointerDown(handle(), { clientY: 100 });
    pointerMove(handle(), { clientY: 140 });
    flushFrames();

    expect(panels()[0]).toHaveAttribute("data-panel-size", "60");
  });

  it("RTL 横向时拖拽方向取反", async () => {
    const { handle, group, panels } = await setup();
    group().style.direction = "rtl";

    pointerDown(handle(), { clientX: 100 });
    pointerMove(handle(), { clientX: 140 });
    flushFrames();

    expect(panels()[0]).toHaveAttribute("data-panel-size", "40");
  });

  it("主轴尺寸为 0 时按 1px 兜底（避免除零）", async () => {
    const { group, handle, panels } = await setup();
    Object.defineProperty(group(), "clientWidth", {
      value: 0,
      configurable: true,
    });

    pointerDown(handle(), { clientX: 100 });
    pointerMove(handle(), { clientX: 101 });
    flushFrames();

    // 1px / 1px * 100 = 100% 增量，但被上一个面板的 max 约束到 100
    expect(panels()[0]).toHaveAttribute("data-panel-size", "100");
  });

  it("disabled 时 pointerdown 不进入拖拽", async () => {
    const onDragging = vi.fn();
    const { handle } = await setup({ disabled: true, onDragging });

    pointerDown(handle());

    expect(onDragging).not.toHaveBeenCalled();
  });

  it("非左键不进入拖拽", async () => {
    const onDragging = vi.fn();
    const { handle } = await setup({ onDragging });

    pointerDown(handle(), { button: 2 });

    expect(onDragging).not.toHaveBeenCalled();
  });

  it("没有相邻面板时不进入拖拽", async () => {
    const onDragging = vi.fn();
    const { container } = render(() => (
      <ResizablePanelGroup>
        <ResizableHandle onDragging={onDragging} />
      </ResizablePanelGroup>
    ));
    const handle = container.querySelector(
      '[data-slot="resizable-handle"]',
    ) as HTMLElement;

    pointerDown(handle);

    expect(onDragging).not.toHaveBeenCalled();
  });

  it("拖拽结束后才落地的帧不会重复应用（flush 的 drag 守卫）", async () => {
    const { handle, panels } = await setup();

    pointerDown(handle(), { clientX: 100 });
    pointerMove(handle(), { clientX: 140 });
    pointerUp(handle());
    expect(panels()[0]).toHaveAttribute("data-panel-size", "60");

    // 测试桩不真正取消帧：这一帧代表「拖拽已结束才到达」的回调
    flushFrames();

    expect(panels()[0]).toHaveAttribute("data-panel-size", "60");
  });

  it("拖拽中卸载时取消尚未落地的帧", async () => {
    const { handle, unmount } = await setup();

    pointerDown(handle(), { clientX: 100 });
    pointerMove(handle(), { clientX: 140 });

    expect(() => unmount()).not.toThrow();
    flushFrames();
  });

  it("未进入拖拽时的 pointermove / pointerup 是空操作", async () => {
    const { handle, panels } = await setup();

    pointerMove(handle(), { clientX: 300 });
    pointerUp(handle());
    flushFrames();

    expect(panels()[0]).toHaveAttribute("data-panel-size", "50");
  });

  it("pointerId 不匹配的 move/up 被忽略", async () => {
    const { handle, panels } = await setup();

    pointerDown(handle(), { pointerId: 1, clientX: 100 });
    pointerMove(handle(), { pointerId: 2, clientX: 300 });
    flushFrames();

    expect(panels()[0]).toHaveAttribute("data-panel-size", "50");
  });

  it("指针捕获丢失后不再响应 move", async () => {
    const { handle, panels } = await setup();

    pointerDown(handle(), { clientX: 100 });
    captured.clear();
    pointerMove(handle(), { clientX: 140 });
    flushFrames();

    expect(panels()[0]).toHaveAttribute("data-panel-size", "50");
  });
});
