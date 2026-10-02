import { describe, expect, it } from "vitest";
import {
  LONG_PRESS_DELAY,
  LONG_PRESS_MOVE_TOLERANCE,
  isBeyondTolerance,
  isContextMenuKey,
  isLongPressPointer,
  menuAnchorFromRect,
} from "~/components/context-menu/ContextMenuTrigger/context-menu.trigger.utils";

function keyEvent(key: string, shiftKey = false): KeyboardEvent {
  return new KeyboardEvent("keydown", { key, shiftKey });
}

function pointerEvent(pointerType: string): PointerEvent {
  return new PointerEvent("pointerdown", { pointerType });
}

describe("常量", () => {
  it("长按阈值与容差与 Base UI 一致", () => {
    expect(LONG_PRESS_DELAY).toBe(500);
    expect(LONG_PRESS_MOVE_TOLERANCE).toBe(10);
  });
});

describe("isContextMenuKey", () => {
  it("菜单键唤起", () => {
    expect(isContextMenuKey(keyEvent("ContextMenu"))).toBe(true);
  });

  it("Shift+F10 唤起", () => {
    expect(isContextMenuKey(keyEvent("F10", true))).toBe(true);
  });

  it("单独的 F10 不唤起", () => {
    expect(isContextMenuKey(keyEvent("F10"))).toBe(false);
  });

  it("其它按键不唤起", () => {
    expect(isContextMenuKey(keyEvent("Enter", true))).toBe(false);
  });
});

describe("isLongPressPointer", () => {
  it.each(["touch", "pen"])("%s 需要长按处理", (type) => {
    expect(isLongPressPointer(pointerEvent(type))).toBe(true);
  });

  it("鼠标交给原生 contextmenu", () => {
    expect(isLongPressPointer(pointerEvent("mouse"))).toBe(false);
  });
});

describe("isBeyondTolerance", () => {
  const origin = { x: 100, y: 100 };

  it("容差内不算抖动", () => {
    expect(isBeyondTolerance(origin, 106, 108)).toBe(false);
  });

  it("刚好等于容差时不算抖动（严格大于才取消）", () => {
    expect(isBeyondTolerance(origin, 110, 100, 10)).toBe(false);
  });

  it("超过容差算抖动", () => {
    expect(isBeyondTolerance(origin, 111, 100, 10)).toBe(true);
  });

  it("斜向位移按直线距离计算", () => {
    // 6-8-10 直角三角形：斜边正好等于容差
    expect(isBeyondTolerance(origin, 106, 108, 10)).toBe(false);
    expect(isBeyondTolerance(origin, 107, 108, 10)).toBe(true);
  });

  it("默认容差为 10px", () => {
    expect(isBeyondTolerance(origin, 100, 111)).toBe(true);
    expect(isBeyondTolerance(origin, 100, 110)).toBe(false);
  });
});

describe("menuAnchorFromRect", () => {
  it("取矩形中心作为锚点", () => {
    expect(
      menuAnchorFromRect({ left: 100, top: 50, width: 40, height: 20 }),
    ).toEqual({ x: 120, y: 60 });
  });

  it("尺寸为 0 时退化为左上角", () => {
    expect(
      menuAnchorFromRect({ left: 10, top: 20, width: 0, height: 0 }),
    ).toEqual({ x: 10, y: 20 });
  });
});
