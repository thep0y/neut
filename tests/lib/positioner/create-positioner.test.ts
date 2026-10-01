import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { asDOMRect, rect } from "~tests/lib/positioner/test-utils";
import { createPositioner } from "~/lib/positioner/create-positioner";
import { offset } from "~/lib/positioner/middleware/offset";

function elementWithRect(r: ReturnType<typeof rect>): HTMLElement {
  const el = document.createElement("div");
  el.getBoundingClientRect = () => asDOMRect(r);
  document.body.appendChild(el);
  return el;
}

const REF = rect(100, 100, 50, 20);
const FLOATING = rect(0, 0, 200, 80);

describe("createPositioner", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("未就绪时不定位（isPositioned 为 false）", () => {
    const { result, cleanup } = renderHook(() =>
      createPositioner(
        () => undefined,
        () => undefined,
      ),
    );

    expect(result.isPositioned()).toBe(false);

    cleanup();
  });

  it("参考元素就绪后完成首次定位", () => {
    const reference = elementWithRect(REF);
    const floating = elementWithRect(FLOATING);

    const { result, cleanup } = renderHook(() =>
      createPositioner(
        () => reference,
        () => floating,
      ),
    );

    expect(result.isPositioned()).toBe(true);
    // bottom 居中：100 + 25 - 100 = 25；100 + 20 = 120
    expect(result.x()).toBe(25);
    expect(result.y()).toBe(120);

    cleanup();
  });

  it("默认 placement 为 bottom", () => {
    const { result, cleanup } = renderHook(() =>
      createPositioner(
        () => elementWithRect(REF),
        () => elementWithRect(FLOATING),
      ),
    );

    expect(result.placement()).toBe("bottom");

    cleanup();
  });

  it("默认 strategy 为 absolute", () => {
    const { result, cleanup } = renderHook(() =>
      createPositioner(
        () => elementWithRect(REF),
        () => elementWithRect(FLOATING),
      ),
    );

    expect(result.strategy()).toBe("absolute");

    cleanup();
  });

  it("尊重传入的 placement 与 strategy", () => {
    const { result, cleanup } = renderHook(() =>
      createPositioner(
        () => elementWithRect(REF),
        () => elementWithRect(FLOATING),
        { placement: "right-start", strategy: "fixed" },
      ),
    );

    expect(result.placement()).toBe("right-start");
    expect(result.strategy()).toBe("fixed");

    cleanup();
  });

  it("middleware 会生效", () => {
    const { result, cleanup } = renderHook(() =>
      createPositioner(
        () => elementWithRect(REF),
        () => elementWithRect(FLOATING),
        { placement: "bottom", middleware: [offset(10)] },
      ),
    );

    // 120 + 10
    expect(result.y()).toBe(130);

    cleanup();
  });

  it("middleware 的 data 暴露在 middlewareData 上", () => {
    const { result, cleanup } = renderHook(() =>
      createPositioner(
        () => elementWithRect(REF),
        () => elementWithRect(FLOATING),
        {
          middleware: [{ name: "mark", fn: () => ({ data: { ok: 1 } }) }],
        },
      ),
    );

    expect(result.middlewareData()).toEqual({ mark: { ok: 1 } });

    cleanup();
  });

  it("floatingStyles 用 transform 表达坐标并取整", () => {
    const { result, cleanup } = renderHook(() =>
      createPositioner(
        () => elementWithRect(rect(100.4, 100.6, 50, 20)),
        () => elementWithRect(FLOATING),
        { placement: "bottom" },
      ),
    );

    const styles = result.floatingStyles();
    expect(styles.position).toBe("absolute");
    expect(styles.top).toBe("0px");
    expect(styles.left).toBe("0px");
    expect(styles.transform).toMatch(/^translate\(-?\d+px, -?\d+px\)$/);

    cleanup();
  });

  it("floatingStyles 的 position 跟随 strategy", () => {
    const { result, cleanup } = renderHook(() =>
      createPositioner(
        () => elementWithRect(REF),
        () => elementWithRect(FLOATING),
        { strategy: "fixed" },
      ),
    );

    expect(result.floatingStyles().position).toBe("fixed");

    cleanup();
  });

  it("update 可手动触发重新计算", () => {
    const floating = elementWithRect(FLOATING);
    const { result, cleanup } = renderHook(() =>
      createPositioner(
        () => elementWithRect(REF),
        () => floating,
        {
          // right 垂直居中，y 会随 floating 高度变化
          placement: "right",
        },
      ),
    );

    // cy - 80/2 = 110 - 40 = 70
    expect(result.y()).toBe(70);

    floating.getBoundingClientRect = () => asDOMRect(rect(0, 0, 200, 200));
    result.update();

    // cy - 200/2 = 110 - 100 = 10
    expect(result.y()).toBe(10);

    cleanup();
  });

  it("元素缺失时 update 会把 isPositioned 置为 false", () => {
    const [reference, setReference] = createSignal<HTMLElement | undefined>(
      elementWithRect(REF),
    );
    const floating = elementWithRect(FLOATING);
    const { result, cleanup } = renderHook(() =>
      createPositioner(reference, () => floating),
    );

    expect(result.isPositioned()).toBe(true);

    setReference(undefined);
    result.update();

    expect(result.isPositioned()).toBe(false);

    cleanup();
  });

  it("响应式 placement 变化时重新计算", () => {
    const [placement, setPlacement] = createSignal<"bottom" | "top">("bottom");
    const { result, cleanup } = renderHook(() =>
      createPositioner(
        () => elementWithRect(REF),
        () => elementWithRect(FLOATING),
        { placement },
      ),
    );

    expect(result.placement()).toBe("bottom");

    setPlacement("top");

    // top 时 y = 100 - 80 = 20
    expect(result.placement()).toBe("top");
    expect(result.y()).toBe(20);

    cleanup();
  });

  it("响应式 strategy 变化时重新计算", () => {
    const [strategy, setStrategy] = createSignal<"absolute" | "fixed">(
      "absolute",
    );
    const { result, cleanup } = renderHook(() =>
      createPositioner(
        () => elementWithRect(REF),
        () => elementWithRect(FLOATING),
        { strategy },
      ),
    );

    expect(result.strategy()).toBe("absolute");

    setStrategy("fixed");

    expect(result.strategy()).toBe("fixed");

    cleanup();
  });

  it("响应式 middleware 变化时重新计算", () => {
    const [mws, setMws] = createSignal([offset(0)]);
    const { result, cleanup } = renderHook(() =>
      createPositioner(
        () => elementWithRect(REF),
        () => elementWithRect(FLOATING),
        { placement: "bottom", middleware: mws },
      ),
    );

    expect(result.y()).toBe(120);

    setMws([offset(30)]);

    expect(result.y()).toBe(150);

    cleanup();
  });

  it("autoUpdate=false 时不附加自动更新", () => {
    const reference = elementWithRect(REF);
    const floating = elementWithRect(FLOATING);
    const addSpy = vi.spyOn(window, "addEventListener");

    const { cleanup } = renderHook(() =>
      createPositioner(
        () => reference,
        () => floating,
        {
          autoUpdate: false,
        },
      ),
    );

    expect(addSpy.mock.calls.some(([type]) => type === "resize")).toBe(false);

    cleanup();
  });

  it("默认开启 autoUpdate（注册 window resize）", () => {
    const reference = elementWithRect(REF);
    const floating = elementWithRect(FLOATING);
    const addSpy = vi.spyOn(window, "addEventListener");

    const { cleanup } = renderHook(() =>
      createPositioner(
        () => reference,
        () => floating,
      ),
    );

    expect(addSpy.mock.calls.some(([type]) => type === "resize")).toBe(true);

    cleanup();
  });

  it("autoUpdate 可传细粒度配置", () => {
    const reference = elementWithRect(REF);
    const floating = elementWithRect(FLOATING);

    const { result, cleanup } = renderHook(() =>
      createPositioner(
        () => reference,
        () => floating,
        {
          autoUpdate: { ancestorScroll: false },
        },
      ),
    );

    expect(result.isPositioned()).toBe(true);

    cleanup();
  });
});
