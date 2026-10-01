import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ROVING_NAV_KEYS,
  computeNextIndex,
  createRovingNavigation,
  type RovingNavItem,
} from "~/utils/roving-navigation";

/** 构造一批按钮并返回可导航的 item 列表 */
function buildItems(
  values: string[],
  disabledIndices: number[] = [],
): { items: RovingNavItem<string>[]; elements: HTMLButtonElement[] } {
  const elements = values.map((value) => {
    const el = document.createElement("button");
    el.textContent = value;
    document.body.appendChild(el);
    return el;
  });
  const items = values.map((value, index) => ({
    value,
    element: elements[index],
    disabled: () => disabledIndices.includes(index),
  }));
  return { items, elements };
}

function makeNav(options: {
  items: RovingNavItem<string>[];
  orientation?: "horizontal" | "vertical";
  dir?: "ltr" | "rtl" | "auto";
  loop?: boolean;
  disabled?: boolean;
  onHighlight?: (v: string) => void;
  getDirectionElement?: (e: KeyboardEvent) => Element | null;
}) {
  return createRovingNavigation({
    getItems: () => options.items,
    orientation: () => options.orientation ?? "horizontal",
    dir: () => options.dir,
    loop: () => options.loop ?? true,
    disabled:
      options.disabled === undefined ? undefined : () => !!options.disabled,
    getDirectionElement: options.getDirectionElement,
    onHighlight: options.onHighlight ?? (() => {}),
  });
}

/** 构造一个 keydown 事件，并把 currentTarget 指向给定元素 */
function createKeyboardEvent(
  currentTarget: HTMLElement,
  key: string,
): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    key,
    cancelable: true,
    bubbles: true,
  });
  Object.defineProperty(event, "currentTarget", { value: currentTarget });
  return event;
}

describe("ROVING_NAV_KEYS", () => {
  it("包含四个方向键与 Home/End", () => {
    expect([...ROVING_NAV_KEYS].sort()).toEqual([
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "End",
      "Home",
    ]);
  });
});

describe("computeNextIndex", () => {
  const ltr = { isVertical: false, isRTL: false, loop: false };
  const rtl = { isVertical: false, isRTL: true, loop: false };
  const vertical = { isVertical: true, isRTL: false, loop: false };

  describe("horizontal + ltr", () => {
    it("ArrowRight 前进", () => {
      expect(computeNextIndex("ArrowRight", 0, 3, ltr)).toBe(1);
    });

    it("ArrowLeft 后退", () => {
      expect(computeNextIndex("ArrowLeft", 2, 3, ltr)).toBe(1);
    });

    it("loop=false 时在末尾按 ArrowRight 停在原地", () => {
      expect(computeNextIndex("ArrowRight", 2, 3, ltr)).toBe(2);
    });

    it("loop=false 时在开头按 ArrowLeft 停在原地", () => {
      expect(computeNextIndex("ArrowLeft", 0, 3, ltr)).toBe(0);
    });

    it("loop=true 时末尾按 ArrowRight 回到开头", () => {
      expect(computeNextIndex("ArrowRight", 2, 3, { ...ltr, loop: true })).toBe(
        0,
      );
    });

    it("loop=true 时开头按 ArrowLeft 跳到末尾", () => {
      expect(computeNextIndex("ArrowLeft", 0, 3, { ...ltr, loop: true })).toBe(
        2,
      );
    });

    it("竖直方向键在 horizontal 布局下不接管", () => {
      expect(computeNextIndex("ArrowUp", 1, 3, ltr)).toBeUndefined();
      expect(computeNextIndex("ArrowDown", 1, 3, ltr)).toBeUndefined();
    });
  });

  describe("horizontal + rtl", () => {
    it("ArrowLeft 前进（方向反转）", () => {
      expect(computeNextIndex("ArrowLeft", 0, 3, rtl)).toBe(1);
    });

    it("ArrowRight 后退（方向反转）", () => {
      expect(computeNextIndex("ArrowRight", 2, 3, rtl)).toBe(1);
    });

    it("loop=true 时同样环绕", () => {
      expect(computeNextIndex("ArrowLeft", 2, 3, { ...rtl, loop: true })).toBe(
        0,
      );
    });
  });

  describe("vertical", () => {
    it("ArrowDown 前进", () => {
      expect(computeNextIndex("ArrowDown", 0, 3, vertical)).toBe(1);
    });

    it("ArrowUp 后退", () => {
      expect(computeNextIndex("ArrowUp", 2, 3, vertical)).toBe(1);
    });

    it("水平方向键在 vertical 布局下不接管", () => {
      expect(computeNextIndex("ArrowLeft", 1, 3, vertical)).toBeUndefined();
      expect(computeNextIndex("ArrowRight", 1, 3, vertical)).toBeUndefined();
    });
  });

  describe("Home / End", () => {
    it("Home 跳到第一个", () => {
      expect(computeNextIndex("Home", 2, 5, ltr)).toBe(0);
    });

    it("End 跳到最后一个", () => {
      expect(computeNextIndex("End", 0, 5, ltr)).toBe(4);
    });

    it("Home/End 在竖直布局下同样生效", () => {
      expect(computeNextIndex("Home", 2, 5, vertical)).toBe(0);
      expect(computeNextIndex("End", 2, 5, vertical)).toBe(4);
    });

    it("Home/End 在 rtl 下不受方向影响", () => {
      expect(computeNextIndex("Home", 2, 5, rtl)).toBe(0);
      expect(computeNextIndex("End", 2, 5, rtl)).toBe(4);
    });
  });

  it("非导航按键返回 undefined（不接管）", () => {
    expect(computeNextIndex("Enter", 0, 3, ltr)).toBeUndefined();
    expect(computeNextIndex("a", 0, 3, ltr)).toBeUndefined();
    expect(computeNextIndex("Tab", 0, 3, ltr)).toBeUndefined();
  });

  it("只有一项时导航始终停在 0", () => {
    expect(computeNextIndex("ArrowRight", 0, 1, ltr)).toBe(0);
    expect(computeNextIndex("ArrowLeft", 0, 1, { ...ltr, loop: true })).toBe(0);
    expect(computeNextIndex("End", 0, 1, ltr)).toBe(0);
  });

  it("loop=true 时越界的负数索引被归一到最后一项", () => {
    // ltr + ArrowLeft 从 0：next = -1，环绕后应为 2
    expect(computeNextIndex("ArrowLeft", 0, 3, { ...ltr, loop: true })).toBe(2);
  });

  it("rtl + ArrowLeft 从 0 时前进到 1（不越界）", () => {
    expect(computeNextIndex("ArrowLeft", 0, 3, { ...rtl, loop: true })).toBe(1);
  });
});

describe("createRovingNavigation", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("ArrowRight 把焦点移到下一项并同步高亮", () => {
    const { items, elements } = buildItems(["a", "b", "c"]);
    const onHighlight = vi.fn();
    const nav = makeNav({ items, onHighlight });

    elements[0].focus();
    nav.handleKeyDown(createKeyboardEvent(elements[0], "ArrowRight"));

    expect(document.activeElement).toBe(elements[1]);
    expect(onHighlight).toHaveBeenCalledWith("b");
  });

  it("焦点不在任何已注册项上时不接管", () => {
    const { items, elements } = buildItems(["a", "b"]);
    const onHighlight = vi.fn();
    const nav = makeNav({ items, onHighlight });

    const outside = document.createElement("button");
    document.body.appendChild(outside);
    outside.focus();

    nav.handleKeyDown(createKeyboardEvent(elements[0], "ArrowRight"));

    expect(document.activeElement).toBe(outside);
    expect(onHighlight).not.toHaveBeenCalled();
  });

  it("不接管非导航按键", () => {
    const { items, elements } = buildItems(["a", "b"]);
    const onHighlight = vi.fn();
    const nav = makeNav({ items, onHighlight });

    elements[0].focus();
    const event = createKeyboardEvent(elements[0], "Enter");
    nav.handleKeyDown(event);

    expect(document.activeElement).toBe(elements[0]);
    expect(event.defaultPrevented).toBe(false);
    expect(onHighlight).not.toHaveBeenCalled();
  });

  it("接管方向键时 preventDefault（避免页面滚动）", () => {
    const { items, elements } = buildItems(["a", "b"]);
    const nav = makeNav({ items });

    elements[0].focus();
    const event = createKeyboardEvent(elements[0], "ArrowRight");
    nav.handleKeyDown(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("方向键与布局不匹配时不 preventDefault", () => {
    const { items, elements } = buildItems(["a", "b"]);
    const nav = makeNav({ items, orientation: "vertical" });

    elements[0].focus();
    const event = createKeyboardEvent(elements[0], "ArrowRight");
    nav.handleKeyDown(event);

    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(elements[0]);
  });

  it("跳过 disabled 项", () => {
    const { items, elements } = buildItems(["a", "b", "c"], [1]);
    const onHighlight = vi.fn();
    const nav = makeNav({ items, onHighlight });

    elements[0].focus();
    nav.handleKeyDown(createKeyboardEvent(elements[0], "ArrowRight"));

    expect(document.activeElement).toBe(elements[2]);
    expect(onHighlight).toHaveBeenCalledWith("c");
  });

  it("全部项都被禁用时不接管", () => {
    const { items, elements } = buildItems(["a", "b"], [0, 1]);
    const onHighlight = vi.fn();
    const nav = makeNav({ items, onHighlight });

    elements[0].focus();
    const event = createKeyboardEvent(elements[0], "ArrowRight");
    nav.handleKeyDown(event);

    expect(event.defaultPrevented).toBe(false);
    expect(onHighlight).not.toHaveBeenCalled();
  });

  it("整组 disabled 时完全不接管", () => {
    const { items, elements } = buildItems(["a", "b"]);
    const onHighlight = vi.fn();
    const nav = makeNav({ items, disabled: true, onHighlight });

    elements[0].focus();
    const event = createKeyboardEvent(elements[0], "ArrowRight");
    nav.handleKeyDown(event);

    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(elements[0]);
    expect(onHighlight).not.toHaveBeenCalled();
  });

  it("未传 disabled 选项时默认视为未禁用", () => {
    const { items, elements } = buildItems(["a", "b"]);
    const nav = makeNav({ items });

    elements[0].focus();
    nav.handleKeyDown(createKeyboardEvent(elements[0], "ArrowRight"));

    expect(document.activeElement).toBe(elements[1]);
  });

  it("Home / End 跳转结合 loop 设置", () => {
    const { items, elements } = buildItems(["a", "b", "c"]);
    const nav = makeNav({ items, loop: false });

    elements[1].focus();
    nav.handleKeyDown(createKeyboardEvent(elements[1], "End"));
    expect(document.activeElement).toBe(elements[2]);

    nav.handleKeyDown(createKeyboardEvent(elements[2], "Home"));
    expect(document.activeElement).toBe(elements[0]);
  });

  it("loop=false 时在边界停止", () => {
    const { items, elements } = buildItems(["a", "b"]);
    const nav = makeNav({ items, loop: false });

    elements[1].focus();
    nav.handleKeyDown(createKeyboardEvent(elements[1], "ArrowRight"));

    expect(document.activeElement).toBe(elements[1]);
  });

  it("loop=true 时环绕到另一端", () => {
    const { items, elements } = buildItems(["a", "b"]);
    const nav = makeNav({ items, loop: true });

    elements[1].focus();
    nav.handleKeyDown(createKeyboardEvent(elements[1], "ArrowRight"));

    expect(document.activeElement).toBe(elements[0]);
  });

  it("动态注册项后导航按最新列表计算", () => {
    let items: RovingNavItem<string>[] = [];
    const nav = createRovingNavigation({
      getItems: () => items,
      orientation: () => "horizontal",
      dir: () => "ltr",
      loop: () => false,
      onHighlight: () => {},
    });

    const first = document.createElement("button");
    const second = document.createElement("button");
    document.body.append(first, second);

    items = [
      { value: "a", element: first, disabled: () => false },
      { value: "b", element: second, disabled: () => false },
    ];

    first.focus();
    nav.handleKeyDown(createKeyboardEvent(first, "ArrowRight"));

    expect(document.activeElement).toBe(second);
  });

  describe("书写方向解析", () => {
    it("dir=ltr 时 ArrowRight 前进", () => {
      const { items, elements } = buildItems(["a", "b"]);
      const nav = makeNav({ items, dir: "ltr" });

      elements[0].focus();
      nav.handleKeyDown(createKeyboardEvent(elements[0], "ArrowRight"));

      expect(document.activeElement).toBe(elements[1]);
    });

    it("dir=rtl 时 ArrowLeft 前进（方向反转）", () => {
      const { items, elements } = buildItems(["a", "b"]);
      const nav = makeNav({ items, dir: "rtl" });

      elements[0].focus();
      nav.handleKeyDown(createKeyboardEvent(elements[0], "ArrowLeft"));

      expect(document.activeElement).toBe(elements[1]);
    });

    it("dir=auto 且无 getDirectionElement 时回退到 documentElement.dir", () => {
      const { items, elements } = buildItems(["a", "b"]);
      const nav = makeNav({ items, dir: "auto" });
      document.documentElement.dir = "rtl";

      try {
        elements[0].focus();
        // rtl 下 ArrowLeft 前进
        nav.handleKeyDown(createKeyboardEvent(elements[0], "ArrowLeft"));
        expect(document.activeElement).toBe(elements[1]);
      } finally {
        document.documentElement.removeAttribute("dir");
      }
    });

    it("dir=auto 时优先用 getDirectionElement 的计算方向", () => {
      const { items, elements } = buildItems(["a", "b"]);
      const host = document.createElement("div");
      host.style.direction = "rtl";
      document.body.appendChild(host);

      const nav = makeNav({
        items,
        dir: "auto",
        getDirectionElement: () => host,
      });

      elements[0].focus();
      nav.handleKeyDown(createKeyboardEvent(elements[0], "ArrowLeft"));

      expect(document.activeElement).toBe(elements[1]);
    });

    it("dir 未指定时也按实际书写方向判断", () => {
      const { items, elements } = buildItems(["a", "b"]);
      const nav = makeNav({ items, dir: undefined });
      document.documentElement.dir = "rtl";

      try {
        elements[0].focus();
        nav.handleKeyDown(createKeyboardEvent(elements[0], "ArrowLeft"));
        expect(document.activeElement).toBe(elements[1]);
      } finally {
        document.documentElement.removeAttribute("dir");
      }
    });

    it("LTR 文档下 ArrowLeft 后退", () => {
      const { items, elements } = buildItems(["a", "b"]);
      const nav = makeNav({ items, dir: undefined });

      elements[1].focus();
      nav.handleKeyDown(createKeyboardEvent(elements[1], "ArrowLeft"));

      expect(document.activeElement).toBe(elements[0]);
    });

    it("getDirectionElement 返回 null 时回退到 documentElement.dir", () => {
      const { items, elements } = buildItems(["a", "b"]);
      const nav = makeNav({
        items,
        dir: "auto",
        getDirectionElement: () => null,
      });
      document.documentElement.dir = "rtl";

      try {
        elements[0].focus();
        nav.handleKeyDown(createKeyboardEvent(elements[0], "ArrowLeft"));
        expect(document.activeElement).toBe(elements[1]);
      } finally {
        document.documentElement.removeAttribute("dir");
      }
    });
  });
});
