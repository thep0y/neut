import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";
import type { Orientation } from "~/components/carousel/Carousel/Carousel.types";
import { useKeyboardNavigation } from "~/components/carousel/Carousel/useKeyboardNavigation";

/**
 * `useKeyboardNavigation` 的按键映射测试：ref 是 **Accessor**
 * （组件里 ref 回调晚于 hook 调用，按值传会永远拿到 undefined，键盘会完全失效），
 * 这里直接派发 KeyboardEvent 并断言四个命令与 preventDefault。
 */

function setup(
  ref: HTMLElement | undefined,
  orientation: () => Orientation = () => "horizontal",
) {
  const scrollPrev = vi.fn();
  const scrollNext = vi.fn();
  const scrollToStart = vi.fn();
  const scrollToEnd = vi.fn();
  const hook = renderHook(() =>
    useKeyboardNavigation({
      ref: () => ref,
      orientation,
      scrollPrev,
      scrollNext,
      scrollToStart,
      scrollToEnd,
    }),
  );
  return { scrollPrev, scrollNext, scrollToStart, scrollToEnd, hook };
}

/** ref 变化时（挂载后才有元素）监听器要能补挂上 */
function setupReactive() {
  const [ref, setRef] = createSignal<HTMLElement | undefined>(undefined);
  const scrollNext = vi.fn();
  const hook = renderHook(() =>
    useKeyboardNavigation({
      ref,
      orientation: () => "horizontal",
      scrollPrev: vi.fn(),
      scrollNext,
      scrollToStart: vi.fn(),
      scrollToEnd: vi.fn(),
    }),
  );
  return { setRef, scrollNext, hook };
}

/** 派发一次可取消的 keydown，返回事件本身用于断言 defaultPrevented */
function press(target: HTMLElement, key: string) {
  const event = new KeyboardEvent("keydown", {
    key,
    cancelable: true,
    bubbles: true,
  });
  target.dispatchEvent(event);
  return event;
}

describe("useKeyboardNavigation - 水平方向", () => {
  it("ArrowLeft 触发上一张并阻止默认滚动", () => {
    const root = document.createElement("section");
    const { scrollPrev, scrollNext } = setup(root);

    const event = press(root, "ArrowLeft");

    expect(scrollPrev).toHaveBeenCalledTimes(1);
    expect(scrollNext).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it("ArrowRight 触发下一张并阻止默认滚动", () => {
    const root = document.createElement("section");
    const { scrollPrev, scrollNext } = setup(root);

    const event = press(root, "ArrowRight");

    expect(scrollNext).toHaveBeenCalledTimes(1);
    expect(scrollPrev).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it("水平方向下 ArrowUp / ArrowDown 不触发任何滚动，也不阻止默认行为", () => {
    const root = document.createElement("section");
    const { scrollPrev, scrollNext } = setup(root);

    const up = press(root, "ArrowUp");
    const down = press(root, "ArrowDown");

    expect(scrollPrev).not.toHaveBeenCalled();
    expect(scrollNext).not.toHaveBeenCalled();
    expect(up.defaultPrevented).toBe(false);
    expect(down.defaultPrevented).toBe(false);
  });
});

describe("useKeyboardNavigation - 垂直方向", () => {
  it("ArrowUp 触发上一张、ArrowDown 触发下一张", () => {
    const root = document.createElement("section");
    const { scrollPrev, scrollNext } = setup(root, () => "vertical");

    const up = press(root, "ArrowUp");
    const down = press(root, "ArrowDown");

    expect(scrollPrev).toHaveBeenCalledTimes(1);
    expect(scrollNext).toHaveBeenCalledTimes(1);
    expect(up.defaultPrevented).toBe(true);
    expect(down.defaultPrevented).toBe(true);
  });

  it("垂直方向下 ArrowLeft / ArrowRight 不触发任何滚动，也不阻止默认行为", () => {
    const root = document.createElement("section");
    const { scrollPrev, scrollNext } = setup(root, () => "vertical");

    const left = press(root, "ArrowLeft");
    const right = press(root, "ArrowRight");

    expect(scrollPrev).not.toHaveBeenCalled();
    expect(scrollNext).not.toHaveBeenCalled();
    expect(left.defaultPrevented).toBe(false);
    expect(right.defaultPrevented).toBe(false);
  });
});

describe("useKeyboardNavigation - Home / End 与其它按键", () => {
  it("挂载后才拿到元素时，监听器会补挂上（回归：键盘曾完全失效）", () => {
    const { setRef, scrollNext } = setupReactive();
    const root = document.createElement("section");
    document.body.appendChild(root);

    setRef(root);
    press(root, "ArrowRight");

    expect(scrollNext).toHaveBeenCalledTimes(1);
    root.remove();
  });

  it("Home 与 End 跳到第一张 / 最后一张", () => {
    const root = document.createElement("section");
    const { scrollPrev, scrollNext } = setup(root);

    const home = press(root, "Home");
    const end = press(root, "End");

    expect(home.defaultPrevented).toBe(true);
    expect(end.defaultPrevented).toBe(true);
    expect(scrollPrev).not.toHaveBeenCalled();
    expect(scrollNext).not.toHaveBeenCalled();
  });

  it("无关按键既不滚动也不阻止默认行为", () => {
    const root = document.createElement("section");
    const { scrollPrev, scrollNext } = setup(root);

    const event = press(root, "Enter");

    expect(scrollPrev).not.toHaveBeenCalled();
    expect(scrollNext).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});

describe("useKeyboardNavigation - 生命周期", () => {
  it("卸载后不再响应按键", () => {
    const root = document.createElement("section");
    const { scrollPrev, hook } = setup(root);

    hook.cleanup();
    const event = press(root, "ArrowLeft");

    expect(scrollPrev).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("ref 为 undefined 时既不抛错也不注册监听", () => {
    const { scrollPrev, scrollNext, hook } = setup(undefined);

    expect(() =>
      press(document.createElement("section"), "ArrowLeft"),
    ).not.toThrow();
    expect(scrollPrev).not.toHaveBeenCalled();
    expect(scrollNext).not.toHaveBeenCalled();
    expect(() => hook.cleanup()).not.toThrow();
  });

  it("方向由 Accessor 实时决定：切换后按键映射随之改变", () => {
    const root = document.createElement("section");
    const [orientation, setOrientation] =
      createSignal<Orientation>("horizontal");
    const { scrollPrev } = setup(root, orientation);

    press(root, "ArrowLeft");
    expect(scrollPrev).toHaveBeenCalledTimes(1);

    setOrientation("vertical");
    press(root, "ArrowLeft");
    // 垂直方向下 ArrowLeft 不再映射到上一张
    expect(scrollPrev).toHaveBeenCalledTimes(1);

    press(root, "ArrowUp");
    expect(scrollPrev).toHaveBeenCalledTimes(2);
  });
});
