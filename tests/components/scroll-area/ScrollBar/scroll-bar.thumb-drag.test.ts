import { afterEach, describe, expect, it, vi } from "vitest";
import { createThumbDrag } from "~/components/scroll-area/ScrollBar/scroll-bar.thumb-drag";
import type { Orientation } from "~/components/scroll-area/ScrollBar/ScrollBar.utils";

function metrics<T extends HTMLElement>(
  el: T,
  size: {
    clientHeight?: number;
    scrollHeight?: number;
    clientWidth?: number;
    scrollWidth?: number;
  },
): T {
  for (const [key, value] of Object.entries(size)) {
    Object.defineProperty(el, key, { configurable: true, value });
  }
  return el;
}

function pointer(type: string, init: PointerEventInit = {}) {
  return new PointerEvent(type, { bubbles: true, cancelable: true, ...init });
}

function setup(
  options: {
    orientation?: Orientation;
    maxScroll?: number;
    withViewport?: boolean;
    withTrack?: boolean;
    withThumb?: boolean;
  } = {},
) {
  const orientation = options.orientation ?? "vertical";
  const maxScroll = options.maxScroll ?? 600;

  const viewport = metrics(document.createElement("div"), {
    clientHeight: 400,
    scrollHeight: 400 + maxScroll,
    clientWidth: 400,
    scrollWidth: 400 + maxScroll,
  });
  // 轨道按 402 取值：内部会扣掉 2px 轨道内边距（TRACK_PADDING_PX），
  // 于是可用行程 = 402 - 2 - 100 = 300，比例正好是 2 倍，断言可用手写常量
  const track = metrics(document.createElement("div"), {
    clientHeight: 402,
    clientWidth: 402,
  });
  const thumb = metrics(document.createElement("div"), {
    clientHeight: 100,
    clientWidth: 100,
  });
  document.body.append(viewport, track, thumb);

  const onDragChange = vi.fn();
  const session = createThumbDrag({
    viewport: () => (options.withViewport === false ? undefined : viewport),
    track: () => (options.withTrack === false ? undefined : track),
    orientation: () => orientation,
    onDragChange,
  });

  /** 通过真实派发让 event.currentTarget 指向 thumb */
  const startDrag = (init: PointerEventInit = {}) => {
    const event = pointer("pointerdown", init);
    const target = options.withThumb === false ? document.body : thumb;
    target.addEventListener(
      "pointerdown",
      (e) => session.start(e as PointerEvent),
      {
        once: true,
      },
    );
    target.dispatchEvent(event);
    return event;
  };

  const move = (init: PointerEventInit = {}) =>
    window.dispatchEvent(pointer("pointermove", init));
  const up = () => window.dispatchEvent(pointer("pointerup"));

  return { viewport, track, thumb, session, onDragChange, startDrag, move, up };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("createThumbDrag 前置条件", () => {
  it("没有 viewport 时不进入拖动（但仍阻止默认行为）", () => {
    const { onDragChange, startDrag } = setup({ withViewport: false });

    const event = startDrag();

    expect(event.defaultPrevented).toBe(true);
    expect(onDragChange).not.toHaveBeenCalled();
  });

  it("没有 track 时不进入拖动", () => {
    const { onDragChange, startDrag } = setup({ withTrack: false });

    startDrag();

    expect(onDragChange).not.toHaveBeenCalled();
  });

  it("事件目标不是滑块（currentTarget 为空）时不进入拖动", () => {
    const { onDragChange, session } = setup({ withThumb: false });

    session.start(pointer("pointerdown"));

    expect(onDragChange).not.toHaveBeenCalled();
  });
});

describe("createThumbDrag 拖动", () => {
  it("开始拖动时回调 active=true、阻止默认行为与冒泡", () => {
    const { onDragChange, startDrag } = setup();
    // 监听冒泡到 body 的 pointerdown：停止冒泡后它不应被调用
    const bubbled = vi.fn();
    document.body.addEventListener("pointerdown", bubbled);

    const event = startDrag();

    expect(event.defaultPrevented).toBe(true);
    expect(bubbled).not.toHaveBeenCalled();
    expect(onDragChange).toHaveBeenCalledWith(true);

    document.body.removeEventListener("pointerdown", bubbled);
  });

  it("纵向按比例写入 scrollTop（可用行程 300，比例 2 倍）", () => {
    const { viewport, startDrag, move } = setup();

    startDrag({ clientY: 0 });
    move({ clientY: 50 });

    expect(viewport.scrollTop).toBe(100);
  });

  it("横向用 clientX 与 scrollLeft", () => {
    const { viewport, startDrag, move } = setup({ orientation: "horizontal" });

    startDrag({ clientX: 0 });
    move({ clientX: 50 });

    expect(viewport.scrollLeft).toBe(100);
  });

  it("拖出区间时滚动位置被夹在 [0, maxScroll]", () => {
    const { viewport, startDrag, move } = setup();

    startDrag({ clientY: 0 });
    move({ clientY: -500 });
    expect(viewport.scrollTop).toBe(0);

    move({ clientY: 5000 });
    expect(viewport.scrollTop).toBe(600);
  });

  it("pointerup 结束拖动：回调 active=false，之后再移动不跟随", () => {
    const { viewport, onDragChange, startDrag, move, up } = setup();

    startDrag({ clientY: 0 });
    move({ clientY: 50 });
    up();
    move({ clientY: 200 });

    expect(onDragChange).toHaveBeenLastCalledWith(false);
    expect(viewport.scrollTop).toBe(100);
  });
});

describe("createThumbDrag 解绑", () => {
  it("拖动中 dispose 会结束拖动并解绑", () => {
    const { viewport, onDragChange, startDrag, move, session } = setup();

    startDrag({ clientY: 0 });
    session.dispose();
    move({ clientY: 100 });

    expect(onDragChange).toHaveBeenLastCalledWith(false);
    expect(viewport.scrollTop).toBe(0);
  });

  it("未拖动时 dispose 不触发 active 回调", () => {
    const { session, onDragChange } = setup();

    session.dispose();

    expect(onDragChange).not.toHaveBeenCalled();
  });

  it("拖动结束后再 dispose 不重复回调", () => {
    const { session, onDragChange, startDrag, up } = setup();

    startDrag({ clientY: 0 });
    up();
    session.dispose();

    expect(onDragChange).toHaveBeenCalledTimes(2); // true 一次、false 一次
  });
});
