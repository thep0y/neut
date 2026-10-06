import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHandleDrag } from "~/components/resizable/ResizableHandle/resizable.handle-drag";
import type { ResizableOrientation } from "~/components/resizable/resizable.types";

/** jsdom 没有 Pointer Events 的 capture API，按元素补一份最小实现 */
function stubPointerCapture(element: HTMLElement) {
  const captured = new Set<number>();
  Object.assign(element, {
    setPointerCapture: (id: number) => captured.add(id),
    hasPointerCapture: (id: number) => captured.has(id),
    releasePointerCapture: (id: number) => captured.delete(id),
  });
  return captured;
}

function pointerEvent(
  type: string,
  init: {
    pointerId?: number;
    clientX?: number;
    clientY?: number;
    button?: number;
  } = {},
): PointerEvent {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: init.button ?? 0,
    clientX: init.clientX ?? 0,
    clientY: init.clientY ?? 0,
  });
  Object.defineProperty(event, "pointerId", { value: init.pointerId ?? 1 });
  return event as unknown as PointerEvent;
}

let frames: FrameRequestCallback[] = [];
let frameId = 0;

function flushFrames() {
  const pending = frames;
  frames = [];
  for (const callback of pending) callback(0);
}

function setup(
  options: {
    orientation?: ResizableOrientation;
    rtl?: boolean;
    groupSizePx?: number;
    prevSize?: number;
    total?: number;
    hasAdjacent?: boolean;
    disabled?: boolean;
    withCallback?: boolean;
  } = {},
) {
  const handle = document.createElement("div");
  document.body.appendChild(handle);
  const captured = stubPointerCapture(handle);

  const ctx = {
    orientation: () => options.orientation ?? "horizontal",
    isRtl: () => options.rtl ?? false,
    groupSizePx: () => options.groupSizePx ?? 400,
    resolveAdjacent: vi.fn(() =>
      options.hasAdjacent === false
        ? undefined
        : { prevSize: options.prevSize ?? 50, total: options.total ?? 100 },
    ),
    setAdjacentSize: vi.fn(),
    beginDrag: vi.fn(),
    endDrag: vi.fn(),
    commitLayout: vi.fn(),
  };

  const onDragging = vi.fn();
  const drag = createHandleDrag(ctx, {
    disabled: () => options.disabled ?? false,
    onDragging: options.withCallback === false ? undefined : onDragging,
  });

  handle.addEventListener("pointerdown", drag.onPointerDown);
  handle.addEventListener("pointermove", drag.onPointerMove);
  handle.addEventListener("pointerup", drag.onPointerUp);

  const dispatch = (
    type: "pointerdown" | "pointermove" | "pointerup",
    init: Parameters<typeof pointerEvent>[1] = {},
  ) => {
    const event = pointerEvent(type, init);
    handle.dispatchEvent(event);
    return event;
  };

  return { handle, captured, ctx, onDragging, drag, dispatch };
}

beforeEach(() => {
  frames = [];
  frameId = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    frames.push(cb);
    return ++frameId;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {
    frames = [];
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createHandleDrag 进入拖拽", () => {
  it("左键、有相邻面板时建立拖拽会话", () => {
    const { dispatch, ctx, captured, onDragging, handle } = setup();

    const event = dispatch("pointerdown", { pointerId: 7, clientX: 100 });

    expect(event.defaultPrevented).toBe(true);
    expect(captured.has(7)).toBe(true);
    expect(ctx.beginDrag).toHaveBeenCalledTimes(1);
    expect(onDragging).toHaveBeenCalledWith(true);
    expect(ctx.resolveAdjacent).toHaveBeenCalledWith(handle);
  });

  it("disabled 时不进入拖拽", () => {
    const { dispatch, ctx, onDragging } = setup({ disabled: true });

    dispatch("pointerdown");

    expect(ctx.beginDrag).not.toHaveBeenCalled();
    expect(onDragging).not.toHaveBeenCalled();
  });

  it("非左键不进入拖拽", () => {
    const { dispatch, ctx } = setup();

    dispatch("pointerdown", { button: 2 });

    expect(ctx.beginDrag).not.toHaveBeenCalled();
  });

  it("没有相邻面板时不进入拖拽", () => {
    const { dispatch, ctx } = setup({ hasAdjacent: false });

    dispatch("pointerdown");

    expect(ctx.beginDrag).not.toHaveBeenCalled();
  });

  it("没有 onDragging 回调时也不报错", () => {
    const { dispatch, ctx } = setup({ withCallback: false });

    expect(() => dispatch("pointerdown")).not.toThrow();
    expect(ctx.beginDrag).toHaveBeenCalledTimes(1);
  });
});

describe("createHandleDrag 拖拽中", () => {
  it("未进入拖拽时 pointermove 被忽略", () => {
    const { dispatch, ctx } = setup();

    dispatch("pointermove", { clientX: 200 });

    expect(ctx.setAdjacentSize).not.toHaveBeenCalled();
  });

  it("pointerId 不匹配的 move 被忽略", () => {
    const { dispatch, ctx } = setup();
    dispatch("pointerdown", { pointerId: 1, clientX: 100 });

    dispatch("pointermove", { pointerId: 2, clientX: 300 });
    flushFrames();

    expect(ctx.setAdjacentSize).not.toHaveBeenCalled();
  });

  it("捕获丢失后不再响应 move", () => {
    const { dispatch, ctx, captured } = setup();
    dispatch("pointerdown", { pointerId: 1, clientX: 100 });
    captured.clear();

    dispatch("pointermove", { pointerId: 1, clientX: 300 });
    flushFrames();

    expect(ctx.setAdjacentSize).not.toHaveBeenCalled();
  });

  it("位移按主轴尺寸换算成百分比，并在帧回调里写入", () => {
    const { dispatch, ctx, handle } = setup({ prevSize: 50, groupSizePx: 400 });
    dispatch("pointerdown", { clientX: 100 });

    dispatch("pointermove", { clientX: 140 });
    // 还没到帧回调
    expect(ctx.setAdjacentSize).not.toHaveBeenCalled();

    flushFrames();
    expect(ctx.setAdjacentSize).toHaveBeenCalledWith(handle, 60);
  });

  it("一帧内多次 move 只写一次", () => {
    const { dispatch, ctx, handle } = setup({ prevSize: 50, groupSizePx: 400 });
    dispatch("pointerdown", { clientX: 100 });

    dispatch("pointermove", { clientX: 120 });
    dispatch("pointermove", { clientX: 160 });
    flushFrames();

    expect(ctx.setAdjacentSize).toHaveBeenCalledTimes(1);
    expect(ctx.setAdjacentSize).toHaveBeenCalledWith(handle, 65);
  });

  it("RTL 横向时位移取反", () => {
    const { dispatch, ctx, handle } = setup({ rtl: true, prevSize: 50 });
    dispatch("pointerdown", { clientX: 100 });

    dispatch("pointermove", { clientX: 140 });
    flushFrames();

    expect(ctx.setAdjacentSize).toHaveBeenCalledWith(handle, 40);
  });

  it("纵向用 clientY 作为主轴", () => {
    const { dispatch, ctx, handle } = setup({ orientation: "vertical" });
    dispatch("pointerdown", { clientY: 100 });

    dispatch("pointermove", { clientY: 140 });
    flushFrames();

    expect(ctx.setAdjacentSize).toHaveBeenCalledWith(handle, 60);
  });

  it("主轴尺寸为 0 时按 1px 兜底（不除零）", () => {
    const { dispatch, ctx } = setup({ groupSizePx: 0, prevSize: 0 });
    dispatch("pointerdown", { clientX: 100 });

    dispatch("pointermove", { clientX: 101 });
    flushFrames();

    expect(ctx.setAdjacentSize).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      100,
    );
  });
});

describe("createHandleDrag 结束与清理", () => {
  it("pointerup 结算未落地的帧、释放捕获并提交布局", () => {
    const { dispatch, ctx, captured, onDragging, handle } = setup();
    dispatch("pointerdown", { pointerId: 5, clientX: 100 });
    dispatch("pointermove", { pointerId: 5, clientX: 140 });

    dispatch("pointerup", { pointerId: 5 });

    expect(ctx.setAdjacentSize).toHaveBeenCalledWith(handle, 60);
    expect(captured.has(5)).toBe(false);
    expect(ctx.endDrag).toHaveBeenCalledTimes(1);
    expect(onDragging).toHaveBeenLastCalledWith(false);
    expect(ctx.commitLayout).toHaveBeenCalledTimes(1);
  });

  it("pointerId 不匹配的 up 被忽略", () => {
    const { dispatch, ctx } = setup();
    dispatch("pointerdown", { pointerId: 1, clientX: 100 });

    dispatch("pointerup", { pointerId: 2 });

    expect(ctx.endDrag).not.toHaveBeenCalled();
    expect(ctx.commitLayout).not.toHaveBeenCalled();
  });

  it("已经结算过的帧不会在 up 时重复写入", () => {
    const { dispatch, ctx } = setup();
    dispatch("pointerdown", { clientX: 100 });
    dispatch("pointermove", { clientX: 140 });
    flushFrames();

    dispatch("pointerup");

    expect(ctx.setAdjacentSize).toHaveBeenCalledTimes(1);
  });

  it("拖拽结束后才落地的帧不会重复写入（flush 的 drag 守卫）", () => {
    // 让 cancelAnimationFrame 变成空操作：模拟"帧已经被排队、取消来不及生效"
    vi.stubGlobal("cancelAnimationFrame", () => {});
    const { dispatch, ctx } = setup();
    dispatch("pointerdown", { clientX: 100 });
    dispatch("pointermove", { clientX: 140 });
    dispatch("pointerup");

    const callsAfterUp = ctx.setAdjacentSize.mock.calls.length;
    expect(() => flushFrames()).not.toThrow();
    expect(ctx.setAdjacentSize.mock.calls.length).toBe(callsAfterUp);
  });

  it("捕获已丢失时 pointerup 仍然结算与提交（不调用 release）", () => {
    const { dispatch, ctx, captured, handle } = setup();
    const release = vi.spyOn(handle, "releasePointerCapture");
    dispatch("pointerdown", { pointerId: 3, clientX: 100 });
    captured.clear();

    dispatch("pointerup", { pointerId: 3 });

    expect(release).not.toHaveBeenCalled();
    expect(ctx.endDrag).toHaveBeenCalledTimes(1);
    expect(ctx.commitLayout).toHaveBeenCalledTimes(1);
  });

  it("dispose 会取消尚未落地的帧", () => {
    const { dispatch, drag, ctx } = setup();
    dispatch("pointerdown", { clientX: 100 });
    dispatch("pointermove", { clientX: 140 });

    drag.dispose();
    flushFrames();

    expect(ctx.setAdjacentSize).not.toHaveBeenCalled();
  });

  it("未进入拖拽时 dispose 是空操作", () => {
    const { drag } = setup();

    expect(() => drag.dispose()).not.toThrow();
  });
});
