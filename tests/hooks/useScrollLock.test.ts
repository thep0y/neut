import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `useScrollLock` 用**模块级**引用计数与 `allowedSelectors` 集合，
 * 状态会在测试之间残留。因此每个用例都 `resetModules()` 后重新 import，
 * 拿到干净的模块实例（TESTING.md §5.6 要求显式重置模块级可变状态）。
 */
async function freshModule() {
  vi.resetModules();
  return import("~/hooks/useScrollLock");
}

describe("useScrollLock", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.documentElement.style.cssText = "";
    document.body.style.cssText = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("locked 为 false 时不锁滚动", async () => {
    const { useScrollLock: lock } = await freshModule();
    const { cleanup } = renderHook(() => lock(() => false));

    expect(document.body.style.overflowY).toBe("");

    cleanup();
  });

  it("locked 为 true 时锁住页面滚动", async () => {
    const { useScrollLock: lock } = await freshModule();
    const { cleanup } = renderHook(() => lock(() => true));

    // 没有可滚动容器时锁 body
    expect(document.body.style.overflowY).toBe("hidden");
    expect(document.body.style.overflowX).toBe("hidden");

    cleanup();
  });

  it("解锁后恢复原有的内联滚动样式", async () => {
    document.body.style.overflowY = "auto";
    document.body.style.overflowX = "clip";

    const { useScrollLock: lock } = await freshModule();
    const { cleanup } = renderHook(() => lock(() => true));

    expect(document.body.style.overflowY).toBe("hidden");

    cleanup();

    expect(document.body.style.overflowY).toBe("auto");
    expect(document.body.style.overflowX).toBe("clip");
  });

  it("html 自身建立了滚动上下文时锁 html 而不是 body", async () => {
    // 测试能力缺口：jsdom 不展开 overflow 简写，getComputedStyle 也读不到内联值，
    // 因此 `isOverflowElement(document.documentElement)` 在 jsdom 里恒为 false。
    // 这里 stub getComputedStyle 让 html 报告已建立滚动容器，覆盖该分支。
    // 已登记于 TESTING.md §8。
    const original = window.getComputedStyle;
    window.getComputedStyle = ((el: Element) =>
      el === document.documentElement
        ? ({
            overflow: "auto",
            overflowX: "auto",
            overflowY: "auto",
          } as CSSStyleDeclaration)
        : ({
            overflow: "visible",
            overflowX: "visible",
            overflowY: "visible",
          } as CSSStyleDeclaration)) as typeof window.getComputedStyle;

    try {
      const { useScrollLock: lock } = await freshModule();
      const { cleanup } = renderHook(() => lock(() => true));

      expect(document.documentElement.style.overflowY).toBe("hidden");
      expect(document.body.style.overflowY).toBe("");

      cleanup();

      expect(document.documentElement.style.overflowY).toBe("");
    } finally {
      window.getComputedStyle = original;
    }
  });

  it("解除锁定后重新置为 false 不会重复解锁", async () => {
    const { useScrollLock: lock } = await freshModule();
    const [locked, setLocked] = createSignal(true);
    const { cleanup } = renderHook(() => lock(locked));

    expect(document.body.style.overflowY).toBe("hidden");

    setLocked(false);
    expect(document.body.style.overflowY).toBe("");

    // 再切回 false 不应把状态弄坏
    setLocked(false);
    expect(document.body.style.overflowY).toBe("");

    cleanup();
  });

  it("多个浮层同时持锁：其中一个释放不会提前恢复页面滚动", async () => {
    const { useScrollLock: lock } = await freshModule();
    const first = renderHook(() => lock(() => true));
    const second = renderHook(() => lock(() => true));

    expect(document.body.style.overflowY).toBe("hidden");

    first.cleanup();

    // 第二个仍持锁 => 依然锁定（引用计数生效）
    expect(document.body.style.overflowY).toBe("hidden");

    second.cleanup();

    expect(document.body.style.overflowY).toBe("");
  });

  it("全部释放后清空放行名单，不影响下一次锁", async () => {
    const { useScrollLock: lock } = await freshModule();

    const first = renderHook(() =>
      lock(() => true, { allowedSelector: '[data-slot="popover-content"]' }),
    );
    first.cleanup();

    const second = renderHook(() =>
      lock(() => true, { allowedSelector: '[data-slot="dialog-content"]' }),
    );

    expect(document.body.style.overflowY).toBe("hidden");

    second.cleanup();
    expect(document.body.style.overflowY).toBe("");
  });

  it("重复调用释放函数是幂等的（不会多减引用计数）", async () => {
    // 说明：`root.dispose()` / `renderHook().cleanup()` 本身是幂等的
    // （onCleanup 只触发一次），因此这里通过"锁定 → 切回 false → 卸载"
    // 这条真实路径驱动同一份释放逻辑，验证引用计数不会被减两次。
    const { useScrollLock: lock } = await freshModule();
    const [locked, setLocked] = createSignal(true);
    const first = renderHook(() => lock(locked));
    const second = renderHook(() => lock(() => true));

    expect(document.body.style.overflowY).toBe("hidden");

    // 先让第一个解锁（引用计数 2 -> 1），再卸载它（不应再减到 0）
    setLocked(false);
    expect(document.body.style.overflowY).toBe("hidden");

    first.cleanup();

    // 第二个仍持锁 => 依然锁定，证明没有多减
    expect(document.body.style.overflowY).toBe("hidden");

    second.cleanup();
    expect(document.body.style.overflowY).toBe("");
  });

  it("allowedSelector 命中的容器内滚动被放行", async () => {
    const { useScrollLock: lock } = await freshModule();
    const allowed = document.createElement("div");
    allowed.setAttribute("data-slot", "popover-content");
    const inner = document.createElement("span");
    allowed.appendChild(inner);
    document.body.appendChild(allowed);

    const wheelEvent = new Event("wheel", { cancelable: true });
    Object.defineProperty(wheelEvent, "target", { value: inner });

    const { cleanup } = renderHook(() =>
      lock(() => true, { allowedSelector: '[data-slot="popover-content"]' }),
    );

    document.dispatchEvent(wheelEvent);

    expect(wheelEvent.defaultPrevented).toBe(false);

    cleanup();
  });

  it("allowedSelector 之外的滚动被拦截", async () => {
    const { useScrollLock: lock } = await freshModule();
    const outside = document.createElement("div");
    document.body.appendChild(outside);

    const wheelEvent = new Event("wheel", { cancelable: true });
    Object.defineProperty(wheelEvent, "target", { value: outside });

    const { cleanup } = renderHook(() =>
      lock(() => true, { allowedSelector: '[data-slot="popover-content"]' }),
    );

    document.dispatchEvent(wheelEvent);

    expect(wheelEvent.defaultPrevented).toBe(true);

    cleanup();
  });

  it("不传 allowedSelector 时拦截所有滚轮事件", async () => {
    const { useScrollLock: lock } = await freshModule();
    const target = document.createElement("div");
    document.body.appendChild(target);

    const wheelEvent = new Event("wheel", { cancelable: true });
    Object.defineProperty(wheelEvent, "target", { value: target });

    const { cleanup } = renderHook(() => lock(() => true));

    document.dispatchEvent(wheelEvent);

    expect(wheelEvent.defaultPrevented).toBe(true);

    cleanup();
  });

  it("touchmove 事件同样被拦截", async () => {
    const { useScrollLock: lock } = await freshModule();
    const target = document.createElement("div");
    document.body.appendChild(target);

    const touchEvent = new Event("touchmove", { cancelable: true });
    Object.defineProperty(touchEvent, "target", { value: target });

    const { cleanup } = renderHook(() => lock(() => true));

    document.dispatchEvent(touchEvent);

    expect(touchEvent.defaultPrevented).toBe(true);

    cleanup();
  });

  it("事件源不是 Element 时也拦截（无法匹配放行名单）", async () => {
    const { useScrollLock: lock } = await freshModule();
    // 不覆盖 target，保持 document（非 Element）：
    // `isWithinAllowedScroll` 会返回 false，因此仍应 preventDefault，
    // 避免"非元素事件源"成为绕过滚动锁的后门。
    const evt = new Event("wheel", { cancelable: true });

    const { cleanup } = renderHook(() =>
      lock(() => true, { allowedSelector: '[data-slot="popover-content"]' }),
    );
    document.dispatchEvent(evt);

    expect(evt.defaultPrevented).toBe(true);

    cleanup();
  });

  it("解锁后滚动位置被恢复", async () => {
    Object.defineProperty(document.body, "scrollTop", {
      configurable: true,
      writable: true,
      value: 120,
    });
    Object.defineProperty(document.body, "scrollLeft", {
      configurable: true,
      writable: true,
      value: 30,
    });

    const { useScrollLock: lock } = await freshModule();
    const { cleanup } = renderHook(() => lock(() => true));

    // 锁定期间被改动
    document.body.scrollTop = 0;
    document.body.scrollLeft = 0;

    cleanup();

    expect(document.body.scrollTop).toBe(120);
    expect(document.body.scrollLeft).toBe(30);
  });

  it("滚动条占位时用 scrollbar-gutter 补偿（支持时）", async () => {
    const supportsSpy = vi.spyOn(CSS, "supports").mockReturnValue(true);
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1020,
    });
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      value: 1000,
    });

    const { useScrollLock: lock } = await freshModule();
    const { cleanup } = renderHook(() => lock(() => true));

    expect(document.documentElement.style.scrollbarGutter).toBe("stable");
    // 用 gutter 时不应再补 padding
    expect(document.body.style.paddingRight).toBe("");

    cleanup();

    expect(document.documentElement.style.scrollbarGutter).toBe("");
    supportsSpy.mockRestore();
  });

  it("不支持 scrollbar-gutter 时用 body paddingRight 补偿", async () => {
    const supportsSpy = vi.spyOn(CSS, "supports").mockReturnValue(false);
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1020,
    });
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      value: 1000,
    });
    document.body.style.paddingRight = "10px";

    const { useScrollLock: lock } = await freshModule();
    const { cleanup } = renderHook(() => lock(() => true));

    // 10 + 20 = 30
    expect(document.body.style.paddingRight).toBe("30px");

    cleanup();

    expect(document.body.style.paddingRight).toBe("10px");
    supportsSpy.mockRestore();
  });

  it("没有占位滚动条时不做横向补偿", async () => {
    const supportsSpy = vi.spyOn(CSS, "supports").mockReturnValue(true);
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      value: 1000,
    });

    const { useScrollLock: lock } = await freshModule();
    const { cleanup } = renderHook(() => lock(() => true));

    expect(document.documentElement.style.scrollbarGutter).toBe("");
    expect(document.body.style.paddingRight).toBe("");

    cleanup();
    supportsSpy.mockRestore();
  });

  it("CSS 不存在时不报错（走 padding 补偿路径）", async () => {
    const original = globalThis.CSS;
    // @ts-expect-error 故意移除，模拟不支持 CSS.supports 的老环境
    globalThis.CSS = undefined;
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1020,
    });
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      value: 1000,
    });

    try {
      const { useScrollLock: lock } = await freshModule();
      const { cleanup } = renderHook(() => lock(() => true));

      expect(document.body.style.paddingRight).toBe("20px");
      cleanup();
    } finally {
      globalThis.CSS = original;
    }
  });
});
