import { describe, expect, it } from "vitest";
import {
  DISMISS_MIN_PX,
  DISMISS_RATIO,
  canDragFromScroller,
  canSwipeFrom,
  clampSwipeOffset,
  findScroller,
  isClosingSwipe,
  isInteractive,
  resolveDismissThreshold,
} from "~/components/drawer/DrawerContent/drawer-swipe.utils";
import type { DrawerSwipeDirection } from "~/components/drawer/Drawer/Drawer.types";

/** 直接给 jsdom 的只读几何属性赋值（jsdom 不做布局，全是 0） */
function geometry(
  element: HTMLElement,
  values: Partial<{
    scrollHeight: number;
    clientHeight: number;
    scrollWidth: number;
    clientWidth: number;
    scrollTop: number;
    scrollLeft: number;
  }>,
) {
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(element, key, { value, configurable: true });
  }
  return element;
}

function scrollable(axis: "vertical" | "horizontal" = "vertical") {
  const element = document.createElement("div");
  if (axis === "vertical") {
    element.style.overflowY = "auto";
    geometry(element, { scrollHeight: 300, clientHeight: 100 });
  } else {
    element.style.overflowX = "auto";
    geometry(element, { scrollWidth: 300, clientWidth: 100 });
  }
  return element;
}

describe("isInteractive", () => {
  it.each([
    ["button", "<button>x</button>"],
    ["链接", "<a href='#'>x</a>"],
    ["输入框", "<input />"],
    ["文本域", "<textarea></textarea>"],
    ["下拉", "<select></select>"],
    ["role=button", "<span role='button'>x</span>"],
    ["contenteditable", "<div contenteditable='true'>x</div>"],
    ["显式禁用拖拽", "<div data-drawer-no-swipe>x</div>"],
  ])("%s 视为可交互", (_name, html) => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    const target = wrapper.firstElementChild!;

    expect(isInteractive(target)).toBe(true);
  });

  it("普通元素不算可交互", () => {
    expect(isInteractive(document.createElement("div"))).toBe(false);
  });
});

describe("findScroller", () => {
  it("返回最近的可滚动祖先", () => {
    const popup = document.createElement("div");
    const outer = scrollable();
    const inner = document.createElement("div");
    const target = document.createElement("span");
    popup.appendChild(outer);
    outer.appendChild(inner);
    inner.appendChild(target);

    expect(findScroller(target, popup, false)).toBe(outer);
  });

  it("overflow 是 auto 但内容没超出时不算可滚动", () => {
    const popup = document.createElement("div");
    const element = document.createElement("div");
    element.style.overflowY = "auto";
    geometry(element, { scrollHeight: 100, clientHeight: 100 });
    const target = document.createElement("span");
    popup.appendChild(element);
    element.appendChild(target);

    expect(findScroller(target, popup, false)).toBeNull();
  });

  it("横向手势只看横向溢出", () => {
    const popup = document.createElement("div");
    const element = scrollable("horizontal");
    const target = document.createElement("span");
    popup.appendChild(element);
    element.appendChild(target);

    expect(findScroller(target, popup, true)).toBe(element);
    // 纵向看同一个元素：没有纵向溢出
    expect(findScroller(target, popup, false)).toBeNull();
  });

  it("走到 popup 就停止（不越过抽屉边界）", () => {
    const popup = document.createElement("div");
    const target = document.createElement("span");
    popup.appendChild(target);

    expect(findScroller(target, popup, false)).toBeNull();
  });

  it("target 就是 popup 时返回 null", () => {
    const popup = document.createElement("div");

    expect(findScroller(popup, popup, false)).toBeNull();
  });
});

describe("canDragFromScroller", () => {
  it("横向方向 left：贴住右边缘才可拖", () => {
    const atEnd = geometry(document.createElement("div"), {
      scrollLeft: 200,
      clientWidth: 100,
      scrollWidth: 300,
    });
    const middle = geometry(document.createElement("div"), {
      scrollLeft: 100,
      clientWidth: 100,
      scrollWidth: 300,
    });

    expect(canDragFromScroller(atEnd, true, "left")).toBe(true);
    expect(canDragFromScroller(middle, true, "left")).toBe(false);
  });

  it("横向方向 right：贴住左边缘才可拖", () => {
    const atStart = geometry(document.createElement("div"), { scrollLeft: 0 });
    const middle = geometry(document.createElement("div"), { scrollLeft: 40 });

    expect(canDragFromScroller(atStart, true, "right")).toBe(true);
    expect(canDragFromScroller(middle, true, "right")).toBe(false);
  });

  it("纵向方向 down：贴住顶部才可拖", () => {
    const atTop = geometry(document.createElement("div"), { scrollTop: 0 });
    const middle = geometry(document.createElement("div"), { scrollTop: 30 });

    expect(canDragFromScroller(atTop, false, "down")).toBe(true);
    expect(canDragFromScroller(middle, false, "down")).toBe(false);
  });

  it("纵向方向 up：贴住底部才可拖", () => {
    const atBottom = geometry(document.createElement("div"), {
      scrollTop: 200,
      clientHeight: 100,
      scrollHeight: 300,
    });
    const middle = geometry(document.createElement("div"), {
      scrollTop: 100,
      clientHeight: 100,
      scrollHeight: 300,
    });

    expect(canDragFromScroller(atBottom, false, "up")).toBe(true);
    expect(canDragFromScroller(middle, false, "up")).toBe(false);
  });
});

describe("canSwipeFrom", () => {
  const popup = document.createElement("div");

  it("可交互元素上不起手", () => {
    const button = document.createElement("button");
    popup.appendChild(button);

    expect(canSwipeFrom(button, popup, false, "down")).toBe(false);
  });

  it("拖拽把手上总是可以起手（即使在滚动容器内）", () => {
    const wrapper = document.createElement("div");
    const handle = document.createElement("div");
    handle.setAttribute("data-slot", "drawer-swipe-handle");
    wrapper.appendChild(handle);
    popup.appendChild(wrapper);

    expect(canSwipeFrom(handle, popup, false, "down")).toBe(true);
  });

  it("没有滚动容器时可以直接起手", () => {
    const target = document.createElement("div");
    popup.appendChild(target);

    expect(canSwipeFrom(target, popup, false, "down")).toBe(true);
  });

  it("滚动容器已贴边时可以起手", () => {
    const scroller = scrollable();
    geometry(scroller, { scrollTop: 0 });
    const target = document.createElement("span");
    popup.appendChild(scroller);
    scroller.appendChild(target);

    expect(canSwipeFrom(target, popup, false, "down")).toBe(true);
  });

  it("滚动容器未贴边时不能起手", () => {
    const scroller = scrollable();
    geometry(scroller, { scrollTop: 120 });
    const target = document.createElement("span");
    popup.appendChild(scroller);
    scroller.appendChild(target);

    expect(canSwipeFrom(target, popup, false, "down")).toBe(false);
  });
});

describe("resolveDismissThreshold", () => {
  it("面板很小时用最小像素阈值", () => {
    expect(resolveDismissThreshold(100)).toBe(DISMISS_MIN_PX);
  });

  it("面板较大时用比例阈值", () => {
    expect(resolveDismissThreshold(1000)).toBe(1000 * DISMISS_RATIO);
  });

  it("刚好相等时取比例值（不小于最小值）", () => {
    expect(resolveDismissThreshold(DISMISS_MIN_PX / DISMISS_RATIO)).toBe(
      DISMISS_MIN_PX,
    );
  });
});

describe("clampSwipeOffset", () => {
  it.each([
    ["left", -30, -30],
    ["left", 30, 0],
    ["up", -30, -30],
    ["up", 30, 0],
    ["right", 30, 30],
    ["right", -30, 0],
    ["down", 30, 30],
    ["down", -30, 0],
  ] as const)("%s 方向位移 %d 夹取为 %d", (dir, delta, expected) => {
    expect(clampSwipeOffset(dir as DrawerSwipeDirection, delta)).toBe(expected);
  });
});

describe("isClosingSwipe", () => {
  it.each([
    ["down", 100],
    ["up", -100],
    ["left", -100],
    ["right", 100],
  ] as const)("%s 方向超过阈值算关闭", (dir, delta) => {
    expect(isClosingSwipe(dir, delta, 80)).toBe(true);
  });

  it.each([
    ["down", -100],
    ["up", 100],
    ["left", 100],
    ["right", -100],
  ] as const)("%s 方向反向位移不算关闭", (dir, delta) => {
    expect(isClosingSwipe(dir, delta, 80)).toBe(false);
  });

  it("位移不足阈值不算关闭", () => {
    expect(isClosingSwipe("down", 79, 80)).toBe(false);
  });

  it("刚好等于阈值不算关闭（严格大于）", () => {
    expect(isClosingSwipe("down", 80, 80)).toBe(false);
  });
});
