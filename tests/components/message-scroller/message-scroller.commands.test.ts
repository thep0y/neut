import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createScrollCommands } from "~/components/message-scroller/message-scroller.commands";
import { createDomMeasure } from "~/components/message-scroller/message-scroller.dom-measure";
import { createScrollState } from "~/components/message-scroller/message-scroller.scroll-state";
import {
  ENGINE_DEFAULTS,
  flushFrames,
  stubRect,
} from "~tests/components/message-scroller/test-utils";

/**
 * 滚动命令与 spacer 的单测。
 *
 * 引擎级用例覆盖了"命令被调用的场景"，这里补上模块自身的分支：
 * 容差内直接落位、spacer 的三态与去重、命令的前置条件与模式迁移、
 * 以及没有 viewport 时的静默返回。
 */

beforeEach(() => {
  document.body.innerHTML = "";
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function setup(
  initial: {
    withViewport?: boolean;
    autoScroll?: boolean;
    scrollTop?: number;
    scrollHeight?: number;
    clientHeight?: number;
    contentBottom?: number;
    scrollMargin?: number;
    peek?: number;
  } = {},
) {
  const viewport = document.createElement("div");
  stubRect(viewport, {
    top: 0,
    bottom: initial.clientHeight ?? 400,
    height: initial.clientHeight ?? 400,
  });
  Object.defineProperty(viewport, "scrollHeight", {
    configurable: true,
    value: initial.scrollHeight ?? 1000,
  });
  Object.defineProperty(viewport, "clientHeight", {
    configurable: true,
    value: initial.clientHeight ?? 400,
  });
  Object.defineProperty(viewport, "scrollTop", {
    configurable: true,
    writable: true,
    value: initial.scrollTop ?? 0,
  });
  const scrollToCalls: Array<{ top: number; behavior?: string }> = [];
  viewport.scrollTo = ((arg: ScrollToOptions | number) => {
    const top = typeof arg === "number" ? arg : (arg.top ?? 0);
    scrollToCalls.push({
      top,
      behavior: typeof arg === "number" ? undefined : arg.behavior,
    });
    viewport.scrollTop = top;
  }) as typeof viewport.scrollTo;
  document.body.appendChild(viewport);

  const content = document.createElement("div");
  document.body.appendChild(content);

  const [viewportAccessor, setViewport] = createSignal<HTMLElement | undefined>(
    initial.withViewport === false ? undefined : viewport,
  );
  const [contentAccessor] = createSignal<HTMLElement | undefined>(content);
  const [spacer, setSpacer] = createSignal<HTMLElement | undefined>();
  const [contentBottom, setContentBottom] = createSignal(
    initial.contentBottom ?? 900,
  );
  const options = {
    ...ENGINE_DEFAULTS,
    autoScroll: initial.autoScroll ?? false,
    scrollMargin: initial.scrollMargin ?? 0,
    scrollPreviousItemPeek: initial.peek ?? 64,
  };

  const hook = renderHook(() => {
    const measure = createDomMeasure({
      viewport: viewportAccessor,
      content: contentAccessor,
      spacer,
    });
    const state = createScrollState({
      viewport: viewportAccessor,
      options: () => options,
      contentBottom,
    });
    const scheduleVisibility = vi.fn();
    const commands = createScrollCommands({
      viewport: viewportAccessor,
      content: contentAccessor,
      spacer,
      options: () => options,
      measure,
      state,
      scheduleVisibility,
    });
    return { commands, state, measure, scheduleVisibility };
  });

  return {
    ...hook,
    viewport,
    content,
    scrollToCalls,
    setViewport,
    setSpacer,
    setContentBottom,
  };
}

/** 造一个"在内容里"的行元素 */
function row(
  content: HTMLElement,
  box: { top: number; bottom: number },
): HTMLElement {
  const element = document.createElement("div");
  stubRect(element, box);
  content.appendChild(element);
  return element;
}

describe("createScrollCommands setScrollTop", () => {
  it("没有 viewport 时静默返回", () => {
    const { result } = setup({ withViewport: false });

    expect(() => result.commands.setScrollTop(100)).not.toThrow();
  });

  it("位移在容差内时直接落位、不发起滚动", () => {
    const { result, viewport, scrollToCalls } = setup({ scrollTop: 0 });
    result.state.setFree();

    result.commands.setScrollTop(0.4);

    expect(viewport.scrollTop).toBe(0.4);
    expect(scrollToCalls).toHaveLength(0);
  });

  it("位移超出容差时交给浏览器并在下一帧提交", async () => {
    const { result, viewport, scrollToCalls } = setup({ scrollTop: 0 });

    result.commands.setScrollTop(300, { behavior: "smooth" });

    expect(scrollToCalls).toEqual([{ top: 300, behavior: "smooth" }]);
    expect(viewport.scrollTop).toBe(300);
    await flushFrames(1);
  });

  it("负数被夹到 0", () => {
    const { result, scrollToCalls } = setup({ scrollTop: 500 });

    result.commands.setScrollTop(-100);

    expect(scrollToCalls[0]?.top).toBe(0);
  });

  it("auto 为 true 时开启自动滚动", () => {
    const { result } = setup({ scrollTop: 0 });

    result.commands.setScrollTop(600, { auto: true });

    expect(result.state.autoscrolling()).toBe(true);
  });
});

describe("createScrollCommands spacer", () => {
  it("加上 spacer 后按目标位置设置高度与负 margin", () => {
    const { result, content, setSpacer, setContentBottom } = setup({
      contentBottom: 1100,
    });
    const last = row(content, { top: 900, bottom: 1100 });
    const spacer = document.createElement("div");
    content.appendChild(spacer);
    // 让 rowGap 读到 16px
    const original = window.getComputedStyle.bind(window);
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      (element: Element) =>
        ({
          ...original(element),
          rowGap: "16px",
          paddingBlockStart: "0px",
          paddingBlockEnd: "0px",
        }) as unknown as CSSStyleDeclaration,
    );
    setSpacer(spacer);
    result.commands.setSpacerElement(spacer);

    result.commands.scrollToElement(last, { align: "start" });

    // target = 900 - 0 = 900；spacer = 900 + 400 - 1100 = 200
    expect(result.commands.spacerHeight()).toBe(200);
    expect(spacer.hidden).toBe(false);
    expect(spacer.style.height).toBe("200px");
    expect(spacer.style.marginTop).toBe("-16px");
    setContentBottom(1100);
  });

  it("同一高度重复设置不会重写 DOM", () => {
    const { result, content, setSpacer } = setup({ contentBottom: 1100 });
    const last = row(content, { top: 900, bottom: 1100 });
    const spacer = document.createElement("div");
    content.appendChild(spacer);
    setSpacer(spacer);
    result.commands.setSpacerElement(spacer);
    result.commands.scrollToElement(last, { align: "start" });
    const height = spacer.style.height;

    // 手动改一下，再以同样的高度设置一次：应当不再写回（jsdom 只接受合法长度值）
    spacer.style.height = "7px";
    result.commands.scrollToElement(last, { align: "start" });

    expect(spacer.style.height).toBe("7px");
    expect(height).toBe("200px");
  });

  it("传入 undefined 时行间距按 0 处理", () => {
    const { result, content, setSpacer } = setup({ contentBottom: 1100 });
    const last = row(content, { top: 900, bottom: 1100 });
    const spacer = document.createElement("div");
    content.appendChild(spacer);
    setSpacer(spacer);

    // 没有元素可读行间距 → gap 归零
    result.commands.setSpacerElement(undefined);
    result.commands.scrollToElement(last, { align: "start" });

    expect(result.commands.spacerHeight()).toBe(200);
    // 代码写的是 `-0px`，jsdom 会把序列化结果规范成 `0px`
    expect(spacer.style.marginTop).toBe("0px");
  });

  it("没有 spacer 元素时也能正常滚动", () => {
    const { result, content } = setup();
    const last = row(content, { top: 900, bottom: 1100 });

    expect(result.commands.scrollToElement(last, { align: "start" })).toBe(
      true,
    );
    expect(result.commands.spacerHeight()).toBe(0);
  });
});

describe("createScrollCommands scrollToStart / scrollToEnd", () => {
  it("没有 viewport 时都返回 false", () => {
    const { result } = setup({ withViewport: false });

    expect(result.commands.scrollToStart()).toBe(false);
    expect(result.commands.scrollToEnd()).toBe(false);
  });

  it("scrollToStart 归零并切到自由滚动", () => {
    const { result, viewport } = setup({ autoScroll: true, scrollTop: 600 });
    result.state.setFollowing();

    expect(result.commands.scrollToStart()).toBe(true);

    expect(viewport.scrollTop).toBe(0);
    expect(result.state.isFollowing()).toBe(false);
  });

  it("scrollToEnd 滚到底：autoScroll 开启时回到跟随", () => {
    const { result, viewport } = setup({
      autoScroll: true,
      scrollTop: 0,
      scrollHeight: 1400,
    });

    expect(result.commands.scrollToEnd({ behavior: "smooth" })).toBe(true);

    expect(viewport.scrollTop).toBe(1000);
    expect(result.state.isFollowing()).toBe(true);
  });

  it("scrollToEnd 清掉 spacer 并同步一次可见性", () => {
    const { result, content, setSpacer } = setup({ contentBottom: 1100 });
    const last = row(content, { top: 900, bottom: 1100 });
    const spacer = document.createElement("div");
    content.appendChild(spacer);
    setSpacer(spacer);
    result.commands.setSpacerElement(spacer);
    result.commands.scrollToElement(last, { align: "start" });
    expect(spacer.hidden).toBe(false);

    result.commands.scrollToEnd();

    expect(spacer.hidden).toBe(true);
    expect(spacer.style.height).toBe("0px");
    expect(result.scheduleVisibility).toHaveBeenCalled();
  });
});

describe("createScrollCommands scrollToElement", () => {
  it("目标不在内容里时返回 false", () => {
    const { result } = setup();
    const outsider = document.createElement("div");

    expect(result.commands.scrollToElement(outsider)).toBe(false);
  });

  it("目标在内容里但元素缺失时依然按矩形计算", () => {
    const { result, content } = setup({ contentBottom: 2000 });
    const target = row(content, { top: 1000, bottom: 1200 });

    expect(result.commands.scrollToElement(target, { align: "start" })).toBe(
      true,
    );
  });

  it("keepPreviousPeek 时多留一个 peek 并进入锚定态", () => {
    const { result, content, viewport } = setup({
      contentBottom: 2000,
      peek: 64,
    });
    const target = row(content, { top: 1000, bottom: 1200 });

    result.commands.scrollToElement(
      target,
      { align: "start" },
      { keepPreviousPeek: true },
    );

    expect(viewport.scrollTop).toBe(936);
    expect(result.state.isAnchored()).toBe(true);
  });

  it("不保留 peek 时进入跳转过渡态", () => {
    const { result, content, viewport } = setup({ contentBottom: 2000 });
    const target = row(content, { top: 1000, bottom: 1200 });

    result.commands.scrollToElement(target, { align: "start" });

    expect(viewport.scrollTop).toBe(1000);
    expect(result.state.isAnchored()).toBe(false);
  });

  it("命令里的 scrollMargin 覆盖默认值", () => {
    const { result, content, viewport } = setup({
      contentBottom: 2000,
      scrollMargin: 0,
    });
    const target = row(content, { top: 1000, bottom: 1200 });

    result.commands.scrollToElement(target, {
      align: "start",
      scrollMargin: 24,
    });

    expect(viewport.scrollTop).toBe(976);
  });
});

describe("createScrollCommands targetTopFor", () => {
  it("没有 viewport 时返回 0", () => {
    const { result, content } = setup({ withViewport: false });
    const target = row(content, { top: 100, bottom: 200 });

    expect(result.commands.targetTopFor(target, undefined, 0)).toBe(0);
  });

  it("按 align 计算目标位置", () => {
    const { result, content } = setup();
    const target = row(content, { top: 500, bottom: 700 });

    expect(result.commands.targetTopFor(target, { align: "start" }, 0)).toBe(
      500,
    );
    expect(result.commands.targetTopFor(target, { align: "end" }, 0)).toBe(300);
    // 居中：itemTop - (可视高度 - 行高)/2 = 500 - 100
    expect(result.commands.targetTopFor(target, { align: "center" }, 0)).toBe(
      400,
    );
  });
});
