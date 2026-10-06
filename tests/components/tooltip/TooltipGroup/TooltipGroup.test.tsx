import { fireEvent, render } from "@solidjs/testing-library";
import { onMount } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { stubRect } from "~tests/components/message-scroller/test-utils";
import { Tooltip } from "~/components/tooltip/Tooltip/Tooltip";
import { TooltipContent } from "~/components/tooltip/TooltipContent/TooltipContent";
import {
  useTooltipGroupContext,
  type ActiveTooltipEntry,
  type TooltipGroupContextValue,
} from "~/components/tooltip/TooltipGroup/TooltipGroup.context";
import { TooltipGroup } from "~/components/tooltip/TooltipGroup/TooltipGroup";
import { TooltipTrigger } from "~/components/tooltip/TooltipTrigger/TooltipTrigger";
import type { Rect } from "~/lib";

function rect(width: number, height: number): Rect {
  return { x: 10, y: 20, width, height };
}

function entry(
  value: Rect | undefined,
  forceClose: () => void,
): ActiveTooltipEntry {
  return { rect: () => value, forceClose };
}

/**
 * 直接读取 TooltipGroup 提供的 context。
 *
 * 抢占里几条"读到的是全 0 / detached 矩形"的防御分支，靠 jsdom 的默认全 0 矩形
 * 无法精确区分（宽 0 高非 0、宽非 0 高 0、完全读不到），所以这里把矩形作为
 * 系统边界显式构造，逐条验证"什么样的矩形算合法滑入起点"。
 */
function Probe(props: { onReady: (ctx: TooltipGroupContextValue) => void }) {
  const ctx = useTooltipGroupContext();
  onMount(() => props.onReady(ctx!));
  return null;
}

async function renderGroupProbe() {
  let ctx: TooltipGroupContextValue | undefined;
  const result = render(() => (
    <TooltipGroup>
      <Probe onReady={(value) => (ctx = value)} />
    </TooltipGroup>
  ));
  await Promise.resolve();
  return { ...result, ctx: ctx! };
}

describe("TooltipGroup context - registerActive / claim", () => {
  it("组内没有活跃 tooltip 时 claim 返回 undefined", async () => {
    const { ctx } = await renderGroupProbe();

    expect(ctx.claim()).toBeUndefined();
  });

  it("活跃条目读不到矩形时放弃抢占，但仍然强制关闭它", async () => {
    const { ctx } = await renderGroupProbe();
    const forceClose = vi.fn();
    ctx.registerActive(entry(undefined, forceClose));

    expect(ctx.claim()).toBeUndefined();
    expect(forceClose).toHaveBeenCalledTimes(1);
  });

  it("矩形宽高全为 0（detached 元素）时放弃抢占", async () => {
    const { ctx } = await renderGroupProbe();
    const forceClose = vi.fn();
    ctx.registerActive(entry(rect(0, 0), forceClose));

    expect(ctx.claim()).toBeUndefined();
    expect(forceClose).toHaveBeenCalledTimes(1);
  });

  it("宽为 0 但高不为 0 时仍是合法滑入起点", async () => {
    const { ctx } = await renderGroupProbe();
    const forceClose = vi.fn();
    const target = rect(0, 20);
    ctx.registerActive(entry(target, forceClose));

    expect(ctx.claim()).toBe(target);
    expect(forceClose).toHaveBeenCalledTimes(1);
  });

  it("高为 0 但宽不为 0 时仍是合法滑入起点", async () => {
    const { ctx } = await renderGroupProbe();
    const forceClose = vi.fn();
    const target = rect(20, 0);
    ctx.registerActive(entry(target, forceClose));

    expect(ctx.claim()).toBe(target);
    expect(forceClose).toHaveBeenCalledTimes(1);
  });

  it("抢占成功后清空活跃条目，再次 claim 返回 undefined", async () => {
    const { ctx } = await renderGroupProbe();
    ctx.registerActive(entry(rect(20, 20), vi.fn()));

    expect(ctx.claim()).not.toBeUndefined();
    expect(ctx.claim()).toBeUndefined();
  });

  it("注销自己的条目后 claim 不再命中它", async () => {
    const { ctx } = await renderGroupProbe();
    const target = rect(20, 20);
    const unregister = ctx.registerActive(entry(target, vi.fn()));

    unregister();

    expect(ctx.claim()).toBeUndefined();
  });

  it("新条目接手后，旧条目的注销不会误清掉新条目", async () => {
    const { ctx } = await renderGroupProbe();
    const stale = ctx.registerActive(entry(rect(20, 20), vi.fn()));
    const fresh = rect(30, 30);
    ctx.registerActive(entry(fresh, vi.fn()));

    // A 还没来得及注销时 B 已经抢注册：A 的 cleanup 不应清掉 B
    stale();

    expect(ctx.claim()).toBe(fresh);
  });
});

/**
 * jsdom 不做布局：视口尺寸与元素矩形全为 0，hide 中间件会把浮层判定为
 * "触发器已被裁掉"并拒绝显示。要给"真正可见的 tooltip"一个视口内的坐标
 * （TESTING.md §4.5：只 stub 系统边界）。
 */
function stubLayout(count: number): void {
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    value: 1024,
  });
  Object.defineProperty(document.documentElement, "clientHeight", {
    configurable: true,
    value: 768,
  });
  triggers()
    .slice(0, count)
    .forEach((el, index) => {
      const top = 100 + index * 40;
      el.getBoundingClientRect = () =>
        ({
          top,
          left: 100,
          right: 160,
          bottom: top + 20,
          width: 60,
          height: 20,
          x: 100,
          y: top,
          toJSON: () => ({}),
        }) as DOMRect;
    });
}

/**
 * 组内相邻 trigger 之间切换：旧 tooltip 立即让位（跳过退场动画），
 * 新 tooltip 跳过 openDelay 并从旧位置滑入。
 */
function renderTwoTooltips(openDelay = 0) {
  const result = render(() => (
    <TooltipGroup>
      <Tooltip openDelay={openDelay}>
        <TooltipTrigger>第一个</TooltipTrigger>
        <TooltipContent>提示一</TooltipContent>
      </Tooltip>
      <Tooltip openDelay={openDelay}>
        <TooltipTrigger>第二个</TooltipTrigger>
        <TooltipContent>提示二</TooltipContent>
      </Tooltip>
    </TooltipGroup>
  ));
  stubLayout(2);
  return result;
}

function triggers(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>("button"));
}

function contents(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[role="tooltip"]'));
}

function floatingElement(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-placement]")!;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
  Reflect.deleteProperty(document.documentElement, "clientWidth");
  Reflect.deleteProperty(document.documentElement, "clientHeight");
  vi.restoreAllMocks();
});

describe("TooltipGroup - 组内抢占", () => {
  it("第 2 个 trigger 立刻抢占并立即卸载旧浮层（跳过退场动画）", async () => {
    renderTwoTooltips();
    fireEvent.pointerEnter(triggers()[0]!);
    await vi.advanceTimersByTimeAsync(0);
    expect(contents()).toHaveLength(1);
    stubRect(floatingElement(), { top: 300, bottom: 320, height: 20 });

    fireEvent.pointerEnter(triggers()[1]!);

    // 旧浮层被强制关闭且不播退场动画：同一时刻只有一个 tooltip 可见
    expect(contents()).toHaveLength(1);
    expect(contents()[0]).toHaveTextContent("提示二");
    expect(triggers()[0]).toHaveAttribute("data-state", "closed");
    expect(triggers()[1]).toHaveAttribute("data-state", "open");
  });

  it("被抢占时新浮层从旧位置滑入：先带非零位移，下一帧归零并带过渡", async () => {
    renderTwoTooltips();
    fireEvent.pointerEnter(triggers()[0]!);
    await vi.advanceTimersByTimeAsync(0);
    stubRect(floatingElement(), { top: 300, bottom: 320, height: 20 });

    fireEvent.pointerEnter(triggers()[1]!);
    const slideLayer = contents()[0]!.parentElement!;

    // 第一帧：叠加的偏移让新 tooltip 一出现就落在旧位置上，且不能有过渡
    expect(slideLayer.style.transform).toMatch(/^translate\(/);
    expect(slideLayer.style.transform).not.toBe("translate(0px, 0px)");
    expect(slideLayer.style.transition).toBe("");

    await vi.advanceTimersByTimeAsync(16);

    // 第二帧：偏移归零，过渡接管，视觉上滑到自己的位置
    expect(slideLayer.style.transform).toBe("translate(0px, 0px)");
    expect(slideLayer.style.transition).toBe("transform 150ms ease");
  });

  it("旧浮层矩形全为 0 时放弃滑入，新 tooltip 仍走自己的 openDelay", async () => {
    renderTwoTooltips(300);
    fireEvent.pointerEnter(triggers()[0]!);
    await vi.advanceTimersByTimeAsync(300);
    expect(contents()).toHaveLength(1);
    // jsdom 默认矩形全为 0，claim 会判定为 detached 元素并放弃平移

    fireEvent.pointerEnter(triggers()[1]!);
    await vi.advanceTimersByTimeAsync(0);
    expect(contents()).toHaveLength(0);

    await vi.advanceTimersByTimeAsync(300);
    expect(contents()).toHaveLength(1);
    expect(contents()[0]).toHaveTextContent("提示二");
  });

  it("旧 tooltip 正常关闭后注销，后续切换不再触发抢占", async () => {
    renderTwoTooltips(300);
    fireEvent.pointerEnter(triggers()[0]!);
    await vi.advanceTimersByTimeAsync(300);
    stubRect(floatingElement(), { top: 300, bottom: 320, height: 20 });

    // 正常关闭（走 closeDelay 默认 150），此时应注销活跃登记
    fireEvent.pointerLeave(triggers()[0]!);
    await vi.advanceTimersByTimeAsync(150);
    expect(triggers()[0]).toHaveAttribute("data-state", "closed");

    fireEvent.pointerEnter(triggers()[1]!);
    await vi.advanceTimersByTimeAsync(0);
    // 没有抢占：仍然要等 openDelay（旧浮层这时可能还在退场动画里）
    expect(triggers()[1]).toHaveAttribute("data-state", "closed");

    await vi.advanceTimersByTimeAsync(300);
    expect(contents()).toHaveLength(1);
    expect(contents()[0]).toHaveTextContent("提示二");
  });

  it("同时打开的两条 tooltip 中，先关掉一条不会清掉另一条的活跃登记", async () => {
    render(() => (
      <TooltipGroup>
        <Tooltip defaultOpen>
          <TooltipTrigger>第一个</TooltipTrigger>
          <TooltipContent>提示一</TooltipContent>
        </Tooltip>
        <Tooltip defaultOpen>
          <TooltipTrigger>第二个</TooltipTrigger>
          <TooltipContent>提示二</TooltipContent>
        </Tooltip>
        <Tooltip openDelay={500}>
          <TooltipTrigger>第三个</TooltipTrigger>
          <TooltipContent>提示三</TooltipContent>
        </Tooltip>
      </TooltipGroup>
    ));
    await Promise.resolve();
    stubLayout(3);

    // 第 2 条是最后注册的活跃条目，给它一个合法矩形
    const flattings =
      document.querySelectorAll<HTMLElement>("[data-placement]");
    stubRect(flattings[1]!, { top: 100, bottom: 120, height: 20 });

    // 关掉第 1 条：它的注销不能把第 2 条的登记一起清掉
    fireEvent.blur(triggers()[0]!);

    // 第 3 条 hover 后若还能 claim 到第 2 条，会跳过 500ms 的 openDelay 立即出现
    fireEvent.pointerEnter(triggers()[2]!);
    await vi.advanceTimersByTimeAsync(0);

    expect(triggers()[2]).toHaveAttribute("data-state", "open");
    expect(
      Array.from(document.querySelectorAll('[role="tooltip"]')).some(
        (node) => node.textContent === "提示三",
      ),
    ).toBe(true);
  });
});
