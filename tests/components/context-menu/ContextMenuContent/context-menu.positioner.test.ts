import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createPopupPositioner } from "~/components/context-menu/ContextMenuContent/context-menu.positioner";
import type {
  ContextMenuAlign,
  ContextMenuSide,
} from "~/components/context-menu/context-menu.types";
import type { ReferenceElement } from "~/lib";

/**
 * jsdom 不做布局：`documentElement.clientWidth/clientHeight` 恒为 0，
 * 会让 flip 中间件认为任何位置都溢出（全部翻到另一侧）。
 * 这里给视口一个确定尺寸，让"首选位置不翻转"这类断言可验证。
 * （TESTING.md §4.5：只 mock 系统边界。）
 */
beforeEach(() => {
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    value: 1024,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    configurable: true,
    value: 768,
  });
});

afterEach(() => {
  delete (document.documentElement as unknown as Record<string, unknown>)
    .clientWidth;
  delete (document.documentElement as unknown as Record<string, unknown>)
    .clientHeight;
});

function rect(x: number, y: number, width = 0, height = 0): DOMRect {
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    toJSON: () => ({}),
  } as DOMRect;
}

function setup() {
  const [reference, setReference] = createSignal<ReferenceElement>();
  const [positionerElement, setPositionerElement] = createSignal<HTMLElement>();
  const [side, setSide] = createSignal<ContextMenuSide>("right");
  const [align, setAlign] = createSignal<ContextMenuAlign>("start");

  const { result } = renderHook(() =>
    createPopupPositioner({
      reference,
      positionerElement,
      side,
      align,
      dir: () => undefined,
      sideOffset: () => 0,
      alignOffset: () => 4,
      collisionPadding: () => 5,
    }),
  );

  const floating = document.createElement("div");
  floating.getBoundingClientRect = () => rect(0, 0, 100, 40);
  document.body.appendChild(floating);

  return {
    result,
    setReference,
    setPositionerElement,
    setSide,
    setAlign,
    floating,
  };
}

describe("createPopupPositioner", () => {
  it("首选 placement 由 side/align/dir 推导", () => {
    const { result } = setup();

    expect(result.placement()).toBe("right-start");
  });

  it("尚未拿到两个元素时没有可用高度", () => {
    const { result } = setup();

    expect(result.availableHeight()).toBeUndefined();
    expect(result.pos.isPositioned()).toBe(false);
  });

  it("两个元素就位后完成定位并给出可用高度", () => {
    const { result, setReference, setPositionerElement, floating } = setup();

    setPositionerElement(floating);
    setReference({ getBoundingClientRect: () => rect(300, 200, 10, 10) });
    result.pos.update();

    expect(result.pos.isPositioned()).toBe(true);
    expect(typeof result.availableHeight()).toBe("number");
  });

  it("side / align 变化后 placement 跟随", () => {
    const {
      result,
      setReference,
      setPositionerElement,
      setSide,
      setAlign,
      floating,
    } = setup();

    setPositionerElement(floating);
    setReference({ getBoundingClientRect: () => rect(300, 200, 10, 10) });
    result.pos.update();
    expect(result.placement()).toBe("right-start");

    setAlign("center");
    setSide("bottom");
    result.pos.update();

    expect(result.placement()).toBe("bottom");
  });
});
