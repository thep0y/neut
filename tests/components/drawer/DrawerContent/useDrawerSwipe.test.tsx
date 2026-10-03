import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";
import { useDrawerSwipe } from "~/components/drawer/DrawerContent/useDrawerSwipe";
import type { DrawerSwipeDirection } from "~/components/drawer/Drawer/Drawer.types";
import {
  fakeDrawerContext,
  stubOffsetBox,
} from "~tests/components/drawer/test-utils";

/**
 * useDrawerSwipe 单测：用一个假 context 驱动拖拽状态机。
 *
 * jsdom 不做布局：offsetWidth / offsetHeight 恒为 0，而关闭阈值依赖面板尺寸，
 * 因此显式 stub 这两个系统边界（TESTING.md §4.5）。
 * `attach` 注册了 onCleanup，必须在组件 owner 内调用，所以这里包一层 Harness。
 */
function setup(
  overrides: Parameters<typeof fakeDrawerContext>[0] = {},
  box: { offsetWidth?: number; offsetHeight?: number } = {},
  attachTimes = 1,
) {
  const setOpen = vi.fn();
  const ctxValue = fakeDrawerContext({ setOpen, ...overrides });
  let swipe!: ReturnType<typeof useDrawerSwipe>;
  let popup!: HTMLElement;

  const utils = render(() => {
    swipe = useDrawerSwipe(ctxValue);
    return (
      <div
        data-testid="popup"
        ref={(el) => {
          popup = stubOffsetBox(el, box);
          for (let index = 0; index < attachTimes; index += 1) {
            swipe.attach(el);
          }
        }}
      />
    );
  });

  return { setOpen, swipe, popup, ...utils };
}

/** 造一个可滚动容器并挂到 popup 下 */
function makeScroller(
  popup: HTMLElement,
  metrics: { scrollTop: number; scrollHeight: number; clientHeight: number },
) {
  const scroller = document.createElement("div");
  scroller.style.overflowY = "auto";
  Object.defineProperty(scroller, "scrollHeight", {
    configurable: true,
    value: metrics.scrollHeight,
  });
  Object.defineProperty(scroller, "clientHeight", {
    configurable: true,
    value: metrics.clientHeight,
  });
  Object.defineProperty(scroller, "scrollTop", {
    configurable: true,
    writable: true,
    value: metrics.scrollTop,
  });
  popup.appendChild(scroller);
  return scroller;
}

describe("useDrawerSwipe - 起手判定", () => {
  it("初始未拖拽，位移为 0", () => {
    const { swipe } = setup();

    expect(swipe.dragging()).toBe(false);
    expect(swipe.dragX()).toBe(0);
    expect(swipe.dragY()).toBe(0);
  });

  it("非主键按下不起手", () => {
    const { swipe, popup } = setup();

    fireEvent.pointerDown(popup, { button: 2, clientY: 0 });

    expect(swipe.dragging()).toBe(false);
  });

  it("从可交互元素起手时不起手", () => {
    const { swipe, popup } = setup();
    const button = document.createElement("button");
    popup.appendChild(button);

    fireEvent.pointerDown(button, { button: 0, clientY: 0 });

    expect(swipe.dragging()).toBe(false);
  });

  it("从还没有贴边的滚动容器起手时不起手", () => {
    const { swipe, popup } = setup();
    const scroller = makeScroller(popup, {
      scrollTop: 50,
      scrollHeight: 300,
      clientHeight: 100,
    });
    const target = document.createElement("span");
    scroller.appendChild(target);

    fireEvent.pointerDown(target, { button: 0, clientY: 0 });

    expect(swipe.dragging()).toBe(false);
  });

  it("滚动容器已贴边时可以从其内部起手", () => {
    const { swipe, popup } = setup();
    const scroller = makeScroller(popup, {
      scrollTop: 0,
      scrollHeight: 300,
      clientHeight: 100,
    });
    const target = document.createElement("span");
    scroller.appendChild(target);

    fireEvent.pointerDown(target, { button: 0, clientY: 0 });

    expect(swipe.dragging()).toBe(true);
  });

  it("主键按下且起手点合法时进入拖拽", () => {
    const { swipe, popup } = setup();

    fireEvent.pointerDown(popup, { button: 0, clientY: 0 });

    expect(swipe.dragging()).toBe(true);
  });
});

describe("useDrawerSwipe - 位移与阈值", () => {
  it("纵向向下位移超过面板 30% 时关闭，reason=swipe", () => {
    const { swipe, popup, setOpen } = setup(undefined, { offsetHeight: 1000 });

    fireEvent.pointerDown(popup, { button: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientY: 350 });
    expect(swipe.dragY()).toBe(350);

    fireEvent.pointerUp(window, { clientY: 350 });

    expect(setOpen).toHaveBeenCalledWith(
      false,
      "swipe",
      expect.any(PointerEvent),
    );
    expect(swipe.dragging()).toBe(false);
    expect(swipe.dragY()).toBe(0);
  });

  it("位移未超过阈值时回弹，不关闭", () => {
    const { swipe, popup, setOpen } = setup(undefined, { offsetHeight: 1000 });

    fireEvent.pointerDown(popup, { button: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientY: 299 });
    fireEvent.pointerUp(window, { clientY: 299 });

    expect(setOpen).not.toHaveBeenCalled();
    expect(swipe.dragging()).toBe(false);
    expect(swipe.dragY()).toBe(0);
  });

  it("面板很小时使用 80px 阈值下限", () => {
    const { popup, setOpen } = setup(undefined, { offsetHeight: 100 });

    fireEvent.pointerDown(popup, { button: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientY: 90 });
    fireEvent.pointerUp(window, { clientY: 90 });

    expect(setOpen).toHaveBeenCalledTimes(1);
  });

  it("方向相反的位移被夹回 0，不关闭", () => {
    const { swipe, popup, setOpen } = setup(undefined, { offsetHeight: 1000 });

    fireEvent.pointerDown(popup, { button: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientY: -400 });
    expect(swipe.dragY()).toBe(0);

    fireEvent.pointerUp(window, { clientY: -400 });

    expect(setOpen).not.toHaveBeenCalled();
  });

  it.each([
    ["left", "offsetWidth", "clientX", -350],
    ["right", "offsetWidth", "clientX", 350],
    ["up", "offsetHeight", "clientY", -350],
  ] as const)(
    "swipeDirection=%s 时沿该方向拖过阈值即关闭",
    (direction, boxKey, axis, delta) => {
      const { swipe, popup, setOpen } = setup(
        { swipeDirection: () => direction as DrawerSwipeDirection },
        { [boxKey]: 1000 },
      );

      fireEvent.pointerDown(popup, { button: 0, clientX: 0, clientY: 0 });
      fireEvent.pointerMove(window, { clientX: delta, clientY: delta });

      expect(axis === "clientX" ? swipe.dragX() : swipe.dragY()).toBe(delta);
      fireEvent.pointerUp(window, { clientX: delta, clientY: delta });

      expect(setOpen).toHaveBeenCalledWith(
        false,
        "swipe",
        expect.any(PointerEvent),
      );
    },
  );

  it("横向方向下相反的位移被夹回 0，不关闭", () => {
    const { swipe, popup, setOpen } = setup(
      { swipeDirection: () => "left" },
      { offsetWidth: 1000 },
    );

    fireEvent.pointerDown(popup, { button: 0, clientX: 0 });
    fireEvent.pointerMove(window, { clientX: 400 });
    expect(swipe.dragX()).toBe(0);

    fireEvent.pointerUp(window, { clientX: 400 });

    expect(setOpen).not.toHaveBeenCalled();
  });

  it("指针被取消（pointercancel）也走同一套判定", () => {
    const { popup, setOpen } = setup(undefined, { offsetHeight: 1000 });

    fireEvent.pointerDown(popup, { button: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientY: 400 });
    fireEvent.pointerCancel(window, { clientY: 400 });

    expect(setOpen).toHaveBeenCalledWith(
      false,
      "swipe",
      expect.any(PointerEvent),
    );
  });

  it("未进入拖拽时的 pointermove 不改变位移", () => {
    const { swipe } = setup();

    fireEvent.pointerMove(window, { clientY: 200 });

    expect(swipe.dragY()).toBe(0);
    expect(swipe.dragging()).toBe(false);
  });
});

describe("useDrawerSwipe - 生命周期", () => {
  it("重复 attach 同一元素时，第二次抬手不再重复关闭", () => {
    const { popup, setOpen } = setup(undefined, { offsetHeight: 0 }, 2);

    fireEvent.pointerDown(popup, { button: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientY: 100 });
    fireEvent.pointerUp(window, { clientY: 100 });

    expect(setOpen).toHaveBeenCalledTimes(1);
  });

  it("关闭处理期间迟到的 pointermove 不会复活拖拽", () => {
    // 模拟「关闭已开始、但仍有一帧 pointermove 排在被送达」的时序：
    // setOpen 回调里再补发一次 move，此时拖拽已复位、旧监听尚未解绑。
    const setOpen = vi.fn(() => {
      fireEvent.pointerMove(window, { clientY: 500 });
    });
    const { swipe, popup } = setup({ setOpen }, { offsetHeight: 1000 }, 2);

    fireEvent.pointerDown(popup, { button: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientY: 400 });
    fireEvent.pointerUp(window, { clientY: 400 });

    expect(setOpen).toHaveBeenCalledTimes(1);
    expect(swipe.dragging()).toBe(false);
    expect(swipe.dragY()).toBe(0);
  });

  it("卸载后窗口监听被解绑，迟到的 pointermove 不再更新位移", () => {
    const { swipe, popup, unmount } = setup(undefined, { offsetHeight: 1000 });

    fireEvent.pointerDown(popup, { button: 0, clientY: 0 });
    fireEvent.pointerMove(window, { clientY: 300 });
    expect(swipe.dragY()).toBe(300);

    unmount();
    fireEvent.pointerMove(window, { clientY: 450 });

    expect(swipe.dragY()).toBe(300);
  });
});
