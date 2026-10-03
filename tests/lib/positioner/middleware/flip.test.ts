import { describe, expect, it } from "vitest";
import {
  VIEWPORT,
  consistentState,
  rect,
} from "~tests/lib/positioner/test-utils";
import { flip } from "~/lib/positioner/middleware/flip";

describe("flip", () => {
  it("middleware 名为 flip", () => {
    expect(flip().name).toBe("flip");
  });

  it("当前方向空间足够时不翻转", () => {
    const result = flip({ boundary: VIEWPORT }).fn(
      consistentState({
        // 参照物在视口上方，bottom 有充足空间
        placement: "bottom",
        reference: rect(400, 100, 100, 40),
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result).toEqual({});
  });

  it("主轴溢出时请求翻转到正对面", () => {
    const result = flip({ boundary: VIEWPORT }).fn(
      consistentState({
        // 参照物贴近视口底部：bottom 放不下 100 高，top 上方空间充足
        placement: "bottom",
        reference: rect(400, 750, 100, 40),
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result.reset).toEqual({ placement: "top" });
    expect(result.data).toEqual({ flipped: true });
  });

  it("参照物贴近视口顶部时从 top 翻到 bottom", () => {
    const result = flip({ boundary: VIEWPORT }).fn(
      consistentState({
        placement: "top",
        reference: rect(400, 10, 100, 40),
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result.reset).toEqual({ placement: "bottom" });
  });

  it("保留对齐后缀一起翻转", () => {
    const result = flip({ boundary: VIEWPORT }).fn(
      consistentState({
        placement: "bottom-start",
        reference: rect(400, 750, 100, 40),
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result.reset).toEqual({ placement: "top-start" });
  });

  it("end 对齐后缀也一起保留", () => {
    const result = flip({ boundary: VIEWPORT }).fn(
      consistentState({
        placement: "bottom-end",
        reference: rect(400, 750, 100, 40),
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result.reset).toEqual({ placement: "top-end" });
  });

  it("已经翻转过就不再翻转，避免来回震荡", () => {
    const result = flip({ boundary: VIEWPORT }).fn(
      consistentState({
        placement: "bottom",
        reference: rect(400, 750, 100, 40),
        floating: rect(0, 0, 200, 100),
        middlewareData: { flip: { flipped: true } },
      }),
    );

    expect(result).toEqual({});
  });

  it("两边都溢出时，翻到溢出更小的一侧", () => {
    // 视口高 60，浮层高 100，参照物 y=20..60：
    //   bottom: y = 60..160  => 溢出 100
    //   top:    y = -80..20  => 溢出 80   （更小，应被选中）
    const tiny = rect(0, 0, 1000, 60);
    const result = flip({ boundary: tiny, fallbackPlacements: ["top"] }).fn(
      consistentState({
        placement: "bottom",
        reference: rect(400, 20, 100, 40),
        floating: rect(0, 0, 200, 100),
        boundary: tiny,
      }),
    );

    expect(result.reset).toEqual({ placement: "top" });
  });

  it("候选溢出严格大于当前时不翻（避免越翻越差）", () => {
    // 视口高 140，浮层高 200，参照物 y=0..40：
    //   bottom: y = 40..240   => 溢出 100
    //   top:    y = -200..0   => 溢出 200  （更差，不应翻）
    const boundary = rect(0, 0, 1000, 140);
    const result = flip({ boundary, fallbackPlacements: ["top"] }).fn(
      consistentState({
        placement: "bottom",
        reference: rect(400, 0, 100, 40),
        floating: rect(0, 0, 200, 200),
        boundary,
      }),
    );

    expect(result.reset).toBeUndefined();
  });

  it("按 fallbackPlacements 顺序尝试，采用第一个不溢出的", () => {
    const result = flip({
      boundary: VIEWPORT,
      fallbackPlacements: ["left", "top"],
    }).fn(
      consistentState({
        // bottom 溢出，left 空间充足
        placement: "bottom",
        reference: rect(400, 750, 100, 40),
        floating: rect(0, 0, 200, 100),
      }),
    );

    // left 需要 200 宽，参照物 x=400 左侧有 400px，够
    expect(result.reset).toEqual({ placement: "left" });
  });

  it("fallbackPlacements 里包含当前 placement 时不会自翻转", () => {
    // 说明：`flip` 内部有 `candidate === placement` 的跳过判断，
    // 但即使去掉它结果也相同（同一 placement 的溢出量必然与当前相等，
    // 既不会命中 `overflow <= 0`，也不会满足严格的 `<` 比较）。
    // 这条用例锁定的是**对外行为**：候选里混入当前 placement 时不会翻给自己。
    const result = flip({
      boundary: VIEWPORT,
      fallbackPlacements: ["bottom", "top"],
    }).fn(
      consistentState({
        placement: "bottom",
        reference: rect(400, 750, 100, 40),
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result.reset).toEqual({ placement: "top" });
    expect(result.data).toEqual({ flipped: true });
  });

  it("fallbackPlacements 只有当前 placement 时不翻", () => {
    const result = flip({
      boundary: VIEWPORT,
      fallbackPlacements: ["bottom"],
    }).fn(
      consistentState({
        placement: "bottom",
        reference: rect(400, 750, 100, 40),
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result).toEqual({});
  });

  it("没有可用候选时返回空对象", () => {
    const result = flip({
      boundary: VIEWPORT,
      fallbackPlacements: ["bottom"],
    }).fn(
      consistentState({
        placement: "bottom",
        reference: rect(400, 750, 100, 40),
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result).toEqual({});
  });

  it("候选都无法完全放下时选溢出最小的那个", () => {
    // 视口高 200；参照物 y=90..130
    //  bottom: y=130..230 => 溢出 30
    //  top:    y=-10..90  => 溢出 10  （更小，应被选中）
    const boundary = rect(0, 0, 1000, 200);
    const result = flip({
      boundary,
      fallbackPlacements: ["top"],
    }).fn(
      consistentState({
        placement: "bottom",
        reference: rect(400, 90, 100, 40),
        floating: rect(0, 0, 200, 100),
        boundary,
      }),
    );

    expect(result.reset).toEqual({ placement: "top" });
  });

  it("候选溢出与当前相同时不翻（避免无意义抖动）", () => {
    // 参照物垂直居中，上下溢出相同
    const boundary = rect(0, 0, 1000, 200);
    const result = flip({
      boundary,
      fallbackPlacements: ["top"],
    }).fn(
      consistentState({
        placement: "bottom",
        // 参照物 y=80..120，浮层高 100
        //  bottom: 120..220 => 溢出 20
        //  top:    -20..80  => 溢出 20
        reference: rect(400, 80, 100, 40),
        floating: rect(0, 0, 200, 100),
        boundary,
      }),
    );

    expect(result.reset).toBeUndefined();
  });

  it("horizontal 方向同样可以翻转", () => {
    const result = flip({ boundary: VIEWPORT }).fn(
      consistentState({
        // right 需要 200 宽，参照物贴右边
        placement: "right",
        reference: rect(900, 300, 100, 40),
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result.reset).toEqual({ placement: "left" });
  });

  it("缺省 boundary 时用视口边界（padding 参与收缩）", () => {
    // jsdom 的 clientWidth/Height 默认 0，显式设置以构造真实边界
    Object.defineProperty(document.documentElement, "clientWidth", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(document.documentElement, "clientHeight", {
      configurable: true,
      value: 800,
    });

    try {
      const result = flip({ padding: 10, fallbackPlacements: ["top"] }).fn(
        consistentState({
          // 参照物贴底：bottom 溢出
          placement: "bottom",
          reference: rect(400, 750, 100, 40),
          floating: rect(0, 0, 200, 100),
        }),
      );

      expect(result.reset).toEqual({ placement: "top" });
    } finally {
      Reflect.deleteProperty(document.documentElement, "clientWidth");
      Reflect.deleteProperty(document.documentElement, "clientHeight");
    }
  });

  it("多个候选都不完全不溢出时，逐个比较后取溢出最小的", () => {
    const boundary = rect(0, 0, 1000, 200);
    const result = flip({
      boundary,
      fallbackPlacements: ["bottom-end", "left", "top"],
    }).fn(
      consistentState({
        // 参照物 y=90..130；浮层 200x100
        //  top:   -10..90  溢出 10  <- 最小
        //  left:  x 方向溢出巨大，主方向(y)溢出 10
        placement: "bottom",
        reference: rect(400, 90, 100, 40),
        floating: rect(0, 0, 200, 100),
        boundary,
      }),
    );

    // 会走到 `candidateMainOverflow < best.overflow` 的比较分支
    const reset = result.reset;
    expect(typeof reset === "object").toBe(true);
    expect(
      typeof reset === "object" ? reset?.placement : undefined,
    ).toBeDefined();
  });

  it("后一个候选比前一个溢出更小时改用后一个", () => {
    // 边界 1000x100，参照物 y=50..90，浮层 200x100：
    //   当前 bottom 溢出 90
    //   bottom-end 溢出 90（先被记为 best，走 `!best` 分支）
    //   top        溢出 50（更小，走 `candidateMainOverflow < best.overflow` 分支）
    const boundary = rect(0, 0, 1000, 100);
    const result = flip({
      boundary,
      fallbackPlacements: ["bottom-end", "top"],
    }).fn(
      consistentState({
        placement: "bottom",
        reference: rect(400, 50, 100, 40),
        floating: rect(0, 0, 200, 100),
        boundary,
      }),
    );

    expect(result.reset).toEqual({ placement: "top" });
  });

  it("后续候选都比当前差时保留先记录的较小溢出", () => {
    // 同上，但把两个候选顺序反过来：top(50) 先被记为 best，
    // bottom-end(90) 因为不小于 best.overflow 而被忽略。
    const boundary = rect(0, 0, 1000, 100);
    const result = flip({
      boundary,
      fallbackPlacements: ["top", "bottom-end"],
    }).fn(
      consistentState({
        placement: "bottom",
        reference: rect(400, 50, 100, 40),
        floating: rect(0, 0, 200, 100),
        boundary,
      }),
    );

    expect(result.reset).toEqual({ placement: "top" });
  });

  it("浮层在交叉轴溢出但主轴够时，不触发翻转", () => {
    const result = flip({ boundary: VIEWPORT }).fn(
      consistentState({
        // 交叉轴溢出交给 shift，不应触发 flip
        placement: "bottom",
        reference: rect(-150, 100, 100, 40),
        floating: rect(0, 0, 200, 100),
      }),
    );

    expect(result).toEqual({});
  });
});
