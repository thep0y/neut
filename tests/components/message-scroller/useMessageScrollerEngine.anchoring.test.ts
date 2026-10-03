import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addRowAtOffset,
  flushFrames,
  flushState,
  renderEngine,
  setupDom,
  stubResizeObserver,
  stubRect,
  syncRow,
} from "~tests/components/message-scroller/test-utils";

/**
 * 引擎的「初始定位 / 新回合锚定 / prepend 保位 / resize」行为。
 *
 * 按 REFACTOR-PLAN.md §4 d 编写：这些用例是 Step 5 把编排搬进
 * `message-scroller.anchoring.ts` 的安全网，拆分时必须保持全绿。
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

/** 内容已就绪后再挂 content：触发"初次定位"路径 */
async function mountWithContent(options: {
  overrides?: Parameters<typeof renderEngine>[0];
  dom?: Parameters<typeof setupDom>[0];
  rows: (content: HTMLElement) => void;
}) {
  const dom = setupDom(options.dom ?? {});
  options.rows(dom.content);
  const hook = renderEngine(options.overrides);
  hook.result.setViewport(dom.viewport);
  hook.result.setContent(dom.content);
  await flushState();
  return { ...hook, ...dom };
}

describe("useMessageScrollerEngine - 初次定位", () => {
  it("defaultScrollPosition=start 滚到顶部", async () => {
    const fixture = await mountWithContent({
      overrides: { defaultScrollPosition: "start" },
      dom: { scrollTop: 300 },
      rows: (content) => {
        addRowAtOffset(content, "m1", {
          offset: 0,
          height: 900,
          scrollTop: 300,
        });
      },
    });

    expect(fixture.viewport.scrollTop).toBe(0);
    fixture.cleanup();
  });

  it("defaultScrollPosition=end 滚到底并取消 pending 遮罩", async () => {
    const fixture = await mountWithContent({
      overrides: { defaultScrollPosition: "end" },
      rows: (content) => {
        addRowAtOffset(content, "m1", { offset: 0, height: 900, scrollTop: 0 });
      },
    });

    expect(fixture.viewport.scrollTop).toBe(600);
    expect(fixture.result.pendingScroll()).toBe(false);
    fixture.cleanup();
  });

  it("last-anchor：该回合放得下时回退到 end", async () => {
    const fixture = await mountWithContent({
      overrides: { defaultScrollPosition: "last-anchor" },
      dom: { scrollHeight: 2000, clientHeight: 400 },
      rows: (content) => {
        addRowAtOffset(
          content,
          "m2",
          { offset: 1200, height: 300, scrollTop: 0 },
          true,
        );
      },
    });

    // 内容底部 1500、锚点顶部 1200 → 差 300 ≤ 400 → 放得下 → 到底
    expect(fixture.viewport.scrollTop).toBe(1600);
    fixture.cleanup();
  });

  it("last-anchor：放不下时把锚点顶到阅读线（start + 保留上一项）", async () => {
    const fixture = await mountWithContent({
      overrides: { defaultScrollPosition: "last-anchor" },
      dom: { scrollHeight: 2600, clientHeight: 400 },
      rows: (content) => {
        addRowAtOffset(
          content,
          "m2",
          { offset: 1400, height: 700, scrollTop: 0 },
          true,
        );
      },
    });

    // target = 1400 - (scrollMargin 0 + peek 64) = 1336
    expect(fixture.viewport.scrollTop).toBe(1336);
    fixture.cleanup();
  });

  it("last-anchor：没有锚点时回退到 end", async () => {
    const fixture = await mountWithContent({
      overrides: { defaultScrollPosition: "last-anchor" },
      rows: (content) => {
        addRowAtOffset(content, "m1", { offset: 0, height: 900, scrollTop: 0 });
      },
    });

    expect(fixture.viewport.scrollTop).toBe(600);
    fixture.cleanup();
  });

  it("只有 content 没有 viewport 时只提交状态、不报错", async () => {
    const content = document.createElement("div");
    document.body.appendChild(content);
    addRowAtOffset(content, "m1", { offset: 0, height: 900, scrollTop: 0 });
    const { result, cleanup } = renderEngine({
      defaultScrollPosition: "end",
      autoScroll: true,
    });

    result.setContent(content);
    await flushState();

    expect(result.scrollableStart()).toBe(false);
    cleanup();
  });
});

describe("useMessageScrollerEngine - prepend 保位", () => {
  it("上方插入历史后按视口差值补偿 scrollTop", async () => {
    const fixture = await mountWithContent({
      overrides: { defaultScrollPosition: "start" },
      dom: { scrollHeight: 2000, clientHeight: 400 },
      rows: (content) => {
        addRowAtOffset(content, "m2", { offset: 0, height: 200, scrollTop: 0 });
        addRowAtOffset(content, "m3", {
          offset: 200,
          height: 200,
          scrollTop: 0,
        });
      },
    });
    fixture.result.registerItem({
      id: "m2",
      element: fixture.content.children[0] as HTMLElement,
    });
    fixture.result.registerItem({
      id: "m3",
      element: fixture.content.children[1] as HTMLElement,
    });
    await flushState();
    expect(fixture.viewport.scrollTop).toBe(0);

    // 在 m2 之前插入一行历史，并让既有行整体下移 200px
    const m1 = document.createElement("div");
    m1.setAttribute("data-message-id", "m1");
    m1.setAttribute("data-scroll-anchor", "false");
    stubRect(m1, { top: 0, bottom: 200 });
    fixture.content.insertBefore(m1, fixture.content.firstElementChild);
    stubRect(fixture.content.children[1] as HTMLElement, {
      top: 200,
      bottom: 400,
    });
    stubRect(fixture.content.children[2] as HTMLElement, {
      top: 400,
      bottom: 600,
    });
    await flushState();

    // m2 相对视口下移了 200px → 补偿 200px
    expect(fixture.viewport.scrollTop).toBe(200);
    fixture.cleanup();
  });

  it("关闭 preserveScrollOnPrepend 时不补偿", async () => {
    const fixture = await mountWithContent({
      overrides: { defaultScrollPosition: "start" },
      dom: { scrollHeight: 2000, clientHeight: 400 },
      rows: (content) => {
        addRowAtOffset(content, "m2", { offset: 0, height: 200, scrollTop: 0 });
        addRowAtOffset(content, "m3", {
          offset: 200,
          height: 200,
          scrollTop: 0,
        });
      },
    });
    fixture.result.setPreserveScrollOnPrepend(false);
    await flushState();

    const m1 = document.createElement("div");
    m1.setAttribute("data-message-id", "m1");
    m1.setAttribute("data-scroll-anchor", "false");
    stubRect(m1, { top: 0, bottom: 200 });
    fixture.content.insertBefore(m1, fixture.content.firstElementChild);
    stubRect(fixture.content.children[1] as HTMLElement, {
      top: 200,
      bottom: 400,
    });
    await flushState();

    expect(fixture.viewport.scrollTop).toBe(0);
    fixture.cleanup();
  });
});

describe("useMessageScrollerEngine - 新回合锚定", () => {
  it("新增单个锚点行时把它顶到阅读线并保留上一项", async () => {
    const fixture = await mountWithContent({
      overrides: { defaultScrollPosition: "start" },
      dom: { scrollHeight: 2000, clientHeight: 400 },
      rows: (content) => {
        addRowAtOffset(content, "m1", { offset: 0, height: 300, scrollTop: 0 });
      },
    });

    addRowAtOffset(
      fixture.content,
      "m2",
      { offset: 300, height: 300, scrollTop: 0 },
      true,
    );
    await flushState();

    // target = 300 - peek 64 = 236
    expect(fixture.viewport.scrollTop).toBe(236);
    fixture.cleanup();
  });

  it("同批出现多个锚点且正在跟随时：直接回到底部（不在锚点间跳）", async () => {
    const fixture = await mountWithContent({
      overrides: { autoScroll: true, defaultScrollPosition: "start" },
      dom: { scrollHeight: 2000, clientHeight: 400 },
      rows: (content) => {
        addRowAtOffset(content, "m1", { offset: 0, height: 900, scrollTop: 0 });
      },
    });
    // 先滚到实时边缘进入 following-bottom
    fixture.viewport.scrollTop = 600;
    syncRow(fixture.content.children[0] as HTMLElement, {
      offset: 0,
      height: 900,
      scrollTop: 600,
    });
    fixture.viewport.dispatchEvent(new Event("scroll"));
    await flushState();

    addRowAtOffset(
      fixture.content,
      "m2",
      { offset: 900, height: 200, scrollTop: 600 },
      true,
    );
    addRowAtOffset(
      fixture.content,
      "m3",
      { offset: 1100, height: 200, scrollTop: 600 },
      true,
    );
    await flushState();

    expect(fixture.viewport.scrollTop).toBe(1600);
    fixture.cleanup();
  });

  it("行数不变但已有行被打开 scrollAnchor 时锚定到它", async () => {
    const fixture = await mountWithContent({
      overrides: { defaultScrollPosition: "start" },
      dom: { scrollHeight: 2000, clientHeight: 400 },
      rows: (content) => {
        // 初次渲染就存在的锚点会被标记为"已处理"，因此不会抢这次锚定
        addRowAtOffset(
          content,
          "m1",
          { offset: 0, height: 300, scrollTop: 0 },
          true,
        );
        addRowAtOffset(content, "m2", {
          offset: 300,
          height: 300,
          scrollTop: 0,
        });
      },
    });
    const m2 = fixture.content.children[1] as HTMLElement;

    m2.dataset.scrollAnchor = "true";
    await flushState();

    // target = 300 - peek 64 = 236（而不是回到 m1 的 -64）
    expect(fixture.viewport.scrollTop).toBe(236);
    fixture.cleanup();
  });

  it("普通追加（非锚点）在自由滚动时不改变位置，只更新可滚动状态", async () => {
    const fixture = await mountWithContent({
      overrides: { defaultScrollPosition: "start" },
      dom: { scrollHeight: 2000, clientHeight: 400 },
      rows: (content) => {
        addRowAtOffset(content, "m1", { offset: 0, height: 300, scrollTop: 0 });
      },
    });

    addRowAtOffset(fixture.content, "m2", {
      offset: 300,
      height: 900,
      scrollTop: 0,
    });
    await flushState();

    expect(fixture.viewport.scrollTop).toBe(0);
    // 内容底部 1200 > 400 → 还能向下滚
    expect(fixture.result.scrollableEnd()).toBe(true);
    fixture.cleanup();
  });
});

describe("useMessageScrollerEngine - resize 处理", () => {
  it("跟随时：resize 直接回到实时边缘", async () => {
    const resize = stubResizeObserver();
    const fixture = await mountWithContent({
      overrides: { autoScroll: true, defaultScrollPosition: "start" },
      dom: { scrollHeight: 2000, clientHeight: 400 },
      rows: (content) => {
        addRowAtOffset(content, "m1", { offset: 0, height: 900, scrollTop: 0 });
      },
    });
    fixture.viewport.scrollTop = 600;
    syncRow(fixture.content.children[0] as HTMLElement, {
      offset: 0,
      height: 900,
      scrollTop: 600,
    });
    fixture.viewport.dispatchEvent(new Event("scroll"));
    await flushState();
    fixture.scrollToCalls.length = 0;

    resize.triggerAll();
    await flushFrames();

    expect(fixture.viewport.scrollTop).toBe(1600);
    fixture.cleanup();
  });

  it("锚定态：resize 后 spacer 归零且开启 autoScroll 时回到底部", async () => {
    const resize = stubResizeObserver();
    const fixture = await mountWithContent({
      overrides: { autoScroll: true, defaultScrollPosition: "start" },
      dom: { scrollHeight: 2600, clientHeight: 400 },
      rows: (content) => {
        addRowAtOffset(content, "m1", { offset: 0, height: 900, scrollTop: 0 });
      },
    });
    const first = fixture.content.children[0] as HTMLElement;
    const spacer = document.createElement("div");
    fixture.content.appendChild(spacer);
    fixture.result.setSpacer(spacer);

    // 末尾放一个锚点行：contentBottom 1700，target 1400 - 64 = 1336 → spacer 36
    const anchor = addRowAtOffset(
      fixture.content,
      "m2",
      { offset: 1400, height: 300, scrollTop: 0 },
      true,
    );
    await flushState();
    expect(spacer.hidden).toBe(false);

    // 把该行撑高，使重锚定后不再需要 spacer（rect 必须与当前 scrollTop 自洽）
    const scrolled = fixture.viewport.scrollTop;
    syncRow(first, { offset: 0, height: 900, scrollTop: scrolled });
    syncRow(anchor, { offset: 1400, height: 700, scrollTop: scrolled });
    resize.triggerAll();
    await flushFrames();

    // spacer 归零 + autoScroll → 回到底部（maxScrollTop = 2600 - 400）
    expect(spacer.hidden).toBe(true);
    expect(fixture.viewport.scrollTop).toBe(2200);
    fixture.cleanup();
  });

  it("autoScroll 关闭时：重锚定后 spacer 归零也不回到底部", async () => {
    const resize = stubResizeObserver();
    const fixture = await mountWithContent({
      overrides: { autoScroll: false, defaultScrollPosition: "start" },
      dom: { scrollHeight: 2600, clientHeight: 400 },
      rows: (content) => {
        addRowAtOffset(content, "m1", { offset: 0, height: 900, scrollTop: 0 });
      },
    });
    const first = fixture.content.children[0] as HTMLElement;
    const spacer = document.createElement("div");
    fixture.content.appendChild(spacer);
    fixture.result.setSpacer(spacer);
    const anchor = addRowAtOffset(
      fixture.content,
      "m2",
      { offset: 1400, height: 300, scrollTop: 0 },
      true,
    );
    await flushState();
    const scrolled = fixture.viewport.scrollTop;

    syncRow(first, { offset: 0, height: 900, scrollTop: scrolled });
    syncRow(anchor, { offset: 1400, height: 700, scrollTop: scrolled });
    resize.triggerAll();
    await flushFrames();

    // 锚定位置不变（不会因为 spacer 归零而跳到底部）
    expect(fixture.viewport.scrollTop).toBe(scrolled);
    fixture.cleanup();
  });

  it("内容里混入非元素子节点时不影响测量", async () => {
    const fixture = await mountWithContent({
      overrides: { defaultScrollPosition: "start" },
      dom: { scrollHeight: 2000, clientHeight: 400 },
      rows: (content) => {
        addRowAtOffset(content, "m1", { offset: 0, height: 900, scrollTop: 0 });
      },
    });

    // 文本节点没有 getBoundingClientRect：若没被过滤掉就会抛错
    fixture.content.appendChild(document.createTextNode("orphan"));
    await flushFrames();

    expect(fixture.result.scrollableEnd()).toBe(true);
    fixture.cleanup();
  });

  it("清除 spacer 元素后仍能正常工作", async () => {
    const fixture = await mountWithContent({
      overrides: { defaultScrollPosition: "start" },
      rows: (content) => {
        addRowAtOffset(content, "m1", { offset: 0, height: 900, scrollTop: 0 });
      },
    });
    const spacer = document.createElement("div");
    fixture.content.appendChild(spacer);
    fixture.result.setSpacer(spacer);

    expect(() => fixture.result.setSpacer(undefined)).not.toThrow();
    await flushFrames();

    expect(fixture.result.scrollableEnd()).toBe(true);
    fixture.cleanup();
  });

  it("没有 MutationObserver / ResizeObserver 时（SSR 兜底）仍可定位", async () => {
    vi.stubGlobal("MutationObserver", undefined);
    vi.stubGlobal("ResizeObserver", undefined);
    let row: HTMLElement | undefined;
    const fixture = await mountWithContent({
      overrides: { defaultScrollPosition: "end" },
      rows: (content) => {
        row = addRowAtOffset(content, "m1", {
          offset: 0,
          height: 900,
          scrollTop: 0,
        });
      },
    });

    expect(fixture.viewport.scrollTop).toBe(600);

    // 没有 ResizeObserver：后续变化不会自动重算，但状态提交链路仍然可用
    syncRow(row!, { offset: 0, height: 900, scrollTop: 600 });
    fixture.viewport.dispatchEvent(new Event("scroll"));
    await flushFrames();

    expect(fixture.result.scrollableEnd()).toBe(false);
    expect(fixture.result.scrollableStart()).toBe(true);
    fixture.cleanup();
  });

  it("重复注销同一行是安全的", async () => {
    const fixture = await mountWithContent({
      overrides: { defaultScrollPosition: "start" },
      rows: (content) => {
        addRowAtOffset(content, "m1", { offset: 0, height: 900, scrollTop: 0 });
      },
    });
    const row = fixture.content.children[0] as HTMLElement;
    const unregister = fixture.result.registerItem({ id: "m1", element: row });

    unregister();
    expect(() => unregister()).not.toThrow();
    await flushFrames();

    expect(fixture.result.visibleMessageIds()).toEqual([]);
    fixture.cleanup();
  });

  it("自由滚动态：resize 只重新提交状态", async () => {
    const resize = stubResizeObserver();
    const fixture = await mountWithContent({
      overrides: { defaultScrollPosition: "start" },
      dom: { scrollHeight: 2000, clientHeight: 400 },
      rows: (content) => {
        addRowAtOffset(content, "m1", { offset: 0, height: 900, scrollTop: 0 });
      },
    });
    expect(fixture.result.scrollableEnd()).toBe(true);

    // 把内容缩到放得下
    syncRow(fixture.content.children[0] as HTMLElement, {
      offset: 0,
      height: 100,
      scrollTop: 0,
    });
    resize.triggerAll();
    await flushFrames();

    expect(fixture.result.scrollableEnd()).toBe(false);
    expect(fixture.viewport.scrollTop).toBe(0);
    fixture.cleanup();
  });
});

describe("useMessageScrollerEngine - 排队后的补滚", () => {
  it("排队目标随后出现时，下一帧把它滚到阅读线", async () => {
    const dom = setupDom({ scrollHeight: 2000, clientHeight: 400 });
    const hook = renderEngine({ defaultScrollPosition: "end" });
    hook.result.setViewport(dom.viewport);
    hook.result.setContent(dom.content);
    await flushState();

    expect(hook.result.scrollToMessage("later", { align: "start" })).toBe(true);

    const row = addRowAtOffset(dom.content, "later", {
      offset: 600,
      height: 300,
      scrollTop: 0,
    });
    hook.result.registerItem({ id: "later", element: row });
    // 真正推进到下一帧：覆盖"排队的 flush 在 rAF 里执行"这条路径
    await flushFrames();

    expect(dom.viewport.scrollTop).toBe(600);
    expect(hook.result.pendingScroll()).toBe(false);
    hook.cleanup();
  });

  it("已挂载但不在 content 内时排队，稍后插入仍能补滚", async () => {
    const fixture = await mountWithContent({
      overrides: { defaultScrollPosition: "start" },
      dom: { scrollHeight: 2000, clientHeight: 400 },
      rows: (content) => {
        addRowAtOffset(content, "m1", { offset: 0, height: 300, scrollTop: 0 });
      },
    });
    const ghost = document.createElement("div");
    measuredGhost(ghost);
    fixture.result.registerItem({ id: "ghost", element: ghost });

    // content 不包含它 → scrollToElement 失败 → 排队（返回 true）
    expect(fixture.result.scrollToMessage("ghost", { align: "start" })).toBe(
      true,
    );

    // 真的插进 content 之后（同一元素重新注册）再跑一帧
    fixture.content.appendChild(ghost);
    stubRect(ghost, { top: 300, bottom: 600, height: 300 });
    fixture.result.registerItem({ id: "ghost", element: ghost });
    await flushState();

    expect(fixture.viewport.scrollTop).toBe(300);
    fixture.cleanup();
  });
});

function measuredGhost(element: HTMLElement) {
  stubRect(element, { top: 0, bottom: 10 });
  document.body.appendChild(element);
  return element;
}
