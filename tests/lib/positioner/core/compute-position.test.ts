import { describe, expect, it, vi } from "vitest";
import type { Middleware } from "~/lib/positioner/types";
import { computePosition } from "~/lib/positioner/core/compute-position";
import { asDOMRect, rect } from "~tests/lib/positioner/test-utils";

/**
 * computePosition 需要真实元素来测 rect。
 * jsdom 里 getBoundingClientRect 全为 0，所以显式 stub 它，
 * 这样才能表达"参照物在哪、浮层多大"。
 */
function elementWithRect(
  el: HTMLElement,
  r: ReturnType<typeof rect>,
): HTMLElement {
  el.getBoundingClientRect = () => asDOMRect(r);
  return el;
}

function referenceAt(r: ReturnType<typeof rect>): HTMLElement {
  return elementWithRect(document.createElement("div"), r);
}

function floatingWith(size = FLOATING): HTMLElement {
  return elementWithRect(document.createElement("div"), size);
}

const REF = rect(100, 100, 50, 20);
const FLOATING = rect(0, 0, 200, 80);

describe("computePosition", () => {
  it("默认 placement 为 bottom", () => {
    const result = computePosition(referenceAt(REF), floatingWith());

    expect(result.placement).toBe("bottom");
  });

  it("默认 strategy 为 absolute", () => {
    const result = computePosition(referenceAt(REF), floatingWith());

    expect(result.strategy).toBe("absolute");
  });

  it("无 middleware 时返回理想坐标", () => {
    const result = computePosition(referenceAt(REF), floatingWith(), {
      placement: "bottom",
    });

    // 居中：100 + 25 - 100 = 25；y = 100 + 20 = 120
    expect(result.x).toBe(25);
    expect(result.y).toBe(120);
  });

  it("指定 placement 时按该方向计算", () => {
    const result = computePosition(referenceAt(REF), floatingWith(), {
      placement: "right-start",
    });

    expect(result.placement).toBe("right-start");
    expect(result.x).toBe(150); // 100 + 50
    expect(result.y).toBe(100); // start 对齐参照物上边缘
  });

  it("按顺序应用每个 middleware 的坐标修改", () => {
    const result = computePosition(referenceAt(REF), floatingWith(), {
      placement: "bottom",
      middleware: [
        { name: "addX", fn: (s) => ({ x: s.x + 10 }) },
        { name: "addY", fn: (s) => ({ y: s.y + 20 }) },
      ],
    });

    expect(result.x).toBe(35); // 25 + 10
    expect(result.y).toBe(140); // 120 + 20
  });

  it("middleware 只返回 data 时不改坐标", () => {
    const result = computePosition(referenceAt(REF), floatingWith(), {
      placement: "bottom",
      middleware: [{ name: "noop", fn: () => ({ data: { ok: true } }) }],
    });

    expect(result.x).toBe(25);
    expect(result.y).toBe(120);
    expect(result.middlewareData).toEqual({ noop: { ok: true } });
  });

  it("middlewareData 按 name 聚合", () => {
    const result = computePosition(referenceAt(REF), floatingWith(), {
      placement: "bottom",
      middleware: [
        { name: "a", fn: () => ({ data: { first: 1 } }) },
        { name: "b", fn: () => ({ data: { second: 2 } }) },
      ],
    });

    expect(result.middlewareData).toEqual({
      a: { first: 1 },
      b: { second: 2 },
    });
  });

  it("同名 middleware 的 data 后者覆盖前者", () => {
    const result = computePosition(referenceAt(REF), floatingWith(), {
      placement: "bottom",
      middleware: [
        { name: "dup", fn: () => ({ data: { v: 1 } }) },
        { name: "dup", fn: () => ({ data: { v: 2 } }) },
      ],
    });

    expect(result.middlewareData).toEqual({ dup: { v: 2 } });
  });

  it("reset 时立即从头重跑，本轮后续 middleware 不执行", () => {
    // 这是重要的性能/正确性语义：reset 会丢弃本轮已算出的坐标，
    // 因此没必要把本轮剩下的 middleware 跑完（它们读到的坐标马上作废）。
    // 之前 flip 排在 arrow/shift 前面时依赖的就是这个行为。
    const calls: string[] = [];
    const flipOnce: Middleware = {
      name: "flipOnce",
      fn: (state) => {
        calls.push(`flip:${state.placement}`);
        if (state.placement === "bottom") {
          return { reset: { placement: "top" } };
        }
        return {};
      },
    };
    const observer: Middleware = {
      name: "observer",
      fn: (state) => {
        calls.push(`observe:${state.placement}`);
        return {};
      },
    };

    const result = computePosition(referenceAt(REF), floatingWith(), {
      placement: "bottom",
      middleware: [flipOnce, observer],
    });

    expect(result.placement).toBe("top");
    expect(calls).toEqual(["flip:bottom", "flip:top", "observe:top"]);
  });

  it("reset 的 middleware 排在后面时，前面的 middleware 已经执行过", () => {
    const calls: string[] = [];
    const marker: Middleware = {
      name: "marker",
      fn: () => {
        calls.push("marker");
        return { data: { seen: true } };
      },
    };
    const flipOnce: Middleware = {
      name: "flipOnce",
      fn: (state) => {
        calls.push(`flip:${state.placement}`);
        return state.placement === "bottom"
          ? { reset: { placement: "top" } }
          : {};
      },
    };

    computePosition(referenceAt(REF), floatingWith(), {
      placement: "bottom",
      middleware: [marker, flipOnce],
    });

    // marker 每轮都会先跑一次（它在 flip 之前）
    expect(calls).toEqual(["marker", "flip:bottom", "marker", "flip:top"]);
  });

  it("reset: true 时保持当前 placement 重跑", () => {
    let count = 0;
    const once: Middleware = {
      name: "once",
      fn: () => {
        count++;
        return count === 1 ? { reset: true } : {};
      },
    };

    const result = computePosition(referenceAt(REF), floatingWith(), {
      placement: "left",
      middleware: [once],
    });

    expect(count).toBe(2);
    expect(result.placement).toBe("left");
  });

  it("reset 循环次数有上限，不会死循环", () => {
    const spy = vi.fn(() => ({ reset: true as const }));

    const result = computePosition(referenceAt(REF), floatingWith(), {
      placement: "bottom",
      middleware: [{ name: "always", fn: spy }],
    });

    // 上限 8 次 pass + 最后一轮 = 9 次执行
    expect(spy).toHaveBeenCalledTimes(9);
    expect(result.placement).toBe("bottom");
  });

  it("reset 后坐标按新 placement 重算", () => {
    const flip: Middleware = {
      name: "flip",
      fn: (state) =>
        state.placement === "bottom" ? { reset: { placement: "top" } } : {},
    };

    const result = computePosition(referenceAt(REF), floatingWith(), {
      placement: "bottom",
      middleware: [flip],
    });

    // top: y = 100 - 80 = 20
    expect(result.y).toBe(20);
  });

  it("fixed strategy 下不叠加滚动偏移", () => {
    const originalX = window.scrollX;
    const originalY = window.scrollY;
    Object.defineProperty(window, "scrollX", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 300,
    });

    try {
      const result = computePosition(referenceAt(REF), floatingWith(), {
        placement: "bottom",
        strategy: "fixed",
      });

      // fixed：直接用视口坐标
      expect(result.x).toBe(25);
      expect(result.y).toBe(120);
    } finally {
      Object.defineProperty(window, "scrollX", {
        configurable: true,
        value: originalX,
      });
      Object.defineProperty(window, "scrollY", {
        configurable: true,
        value: originalY,
      });
    }
  });

  it("absolute strategy 下叠加滚动偏移换算成文档坐标", () => {
    const originalX = window.scrollX;
    const originalY = window.scrollY;
    Object.defineProperty(window, "scrollX", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      value: 300,
    });

    try {
      const result = computePosition(referenceAt(REF), floatingWith(), {
        placement: "bottom",
        strategy: "absolute",
      });

      // 参照物文档坐标 (600,400)，浮层 200x80
      // x = 600 + 25 - 100 = 525；y = 400 + 20 = 420
      expect(result.x).toBe(525);
      expect(result.y).toBe(420);
    } finally {
      Object.defineProperty(window, "scrollX", {
        configurable: true,
        value: originalX,
      });
      Object.defineProperty(window, "scrollY", {
        configurable: true,
        value: originalY,
      });
    }
  });

  it("虚拟参照元素（右键坐标）同样可以参与定位", () => {
    const virtual = {
      getBoundingClientRect: () => asDOMRect(rect(300, 200, 0, 0)),
    };

    const result = computePosition(virtual, floatingWith(), {
      placement: "bottom",
    });
    // 宽度为 0 的锚点：居中即 300 - 100 = 200
    expect(result.x).toBe(200);
    expect(result.y).toBe(200);
  });

  it("middleware 能读到 initialPlacement 与当前 placement", () => {
    const seen: Array<[string, string]> = [];
    const spy: Middleware = {
      name: "spy",
      fn: (state) => {
        seen.push([state.initialPlacement, state.placement]);
        return {};
      },
    };

    computePosition(referenceAt(REF), floatingWith(), {
      placement: "right",
      middleware: [spy],
    });

    expect(seen).toEqual([["right", "right"]]);
  });

  it("middleware 能读到 strategy 与 rects", () => {
    const captured: unknown[] = [];
    const spy: Middleware = {
      name: "spy",
      fn: (state) => {
        captured.push(state.strategy, state.rects.reference);
        return {};
      },
    };

    computePosition(referenceAt(REF), floatingWith(), {
      placement: "bottom",
      strategy: "fixed",
      middleware: [spy],
    });

    expect(captured).toEqual(["fixed", REF]);
  });
});
